import { Request, Response } from 'express';
import { Accessibility, EmailInviteStatus, EmailInviteType, PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { emailService } from '../services/emailService';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '@/services/authService';
import email from '@/config/email';

const prisma = new PrismaClient();

const findProject = (projectId: string | number) => {
    return prisma.project.findUnique({
        where: { projectId: Number(projectId) },
        include: { creatorProfile: true }
    });
};

const getExistingInvite = (projectId: string | number, email: string) => {
    return prisma.emailInvite.findFirst({
        where: {
            projectId: Number(projectId),
            email,
            type: {
                in: [EmailInviteType.PROJECT_INVITE, EmailInviteType.PROJECT_INVITE_AND_REGISTER]
            }
        }
    });
};

const validateInvite1 = (invite: any) => {
    if (!invite) return null;

    if (invite.status === EmailInviteStatus.PENDING) {
        return "Invite already pending for this email";
    }

    if (invite.status === EmailInviteStatus.ACCEPTED) {
        return "User has already accepted this invite";
    }

    return null;
};


const findUserByEmail = (email: string) => {
    return prisma.user.findUnique({ where: { email } });
};

const addDays = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
};

const sendCorrectInviteEmail = async (
    existingUser: any,
    params: { email: string; token: string; projectName: string; senderName: string; link: string }
) => {
    console.log("existingUser==>", existingUser);
    if (existingUser) {
        // user exists → send *join project* email
        return emailService.sendExistingUserProjectInvite({
            email: params.email,
            inviteToken: params.token,
            projectName: params.projectName,
            senderName: params.senderName,
            name: existingUser.name || params.email.split("@")[0],
            link: params.link
        });
    }

    // user does not exist → send *register to join* email
    return emailService.sendProjectInviteEmailAndRegister({
        name: params.email.split("@")[0],
        email: params.email,
        inviteToken: params.token,
        projectName: params.projectName,
        senderName: params.senderName,
        link: params.link
    });
};

const createEmailInvite = (data: any) => {
    return prisma.emailInvite.create({
        data: {
            email: data.email,
            projectId: Number(data.projectId),
            token: data.token,
            expiresAt: data.expiresAt,
            createdBy: data.createdBy,
            type: data.type,
            details: { accessLevel: data.accessLevel, existingUserId: data.existingUserId },
            inviteLink: data.inviteLink
        }
    });
};


export const addProjectInvite = async (req: Request, res: Response) => {
    try {
        const { email, projectId, accessLevel } = req.body;
        const userId = Number((req.user as any)?.userId);

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const project = await findProject(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const existingInvite = await getExistingInvite(projectId, email);
        const validationError = validateInvite1(existingInvite);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        const existingUser = await findUserByEmail(email);

        // Generate token & expiry
        const token = uuidv4();
        const expiresAt = addDays(new Date(), 7);

        const link = existingUser
            ? `${process.env.FRONTEND_URL}/invite/accept?token=${token}`
            : `${process.env.FRONTEND_URL}/register?token=${token}`;

        // Send correct email template based on user registration
        await sendCorrectInviteEmail(existingUser, {
            email,
            token,
            projectName: project.title,
            senderName: project.creatorProfile?.name || "Project Owner",
            link
        });

        const invite = await createEmailInvite({
            email,
            projectId,
            token,
            expiresAt,
            accessLevel,
            createdBy: userId,
            existingUserId: existingUser?.userId ?? null,
            type: existingUser ? EmailInviteType.PROJECT_INVITE : EmailInviteType.PROJECT_INVITE_AND_REGISTER,
            inviteLink: link
        });

        return res.status(201).json({
            success: true,
            message: "Invite sent successfully",
            data: { invite },
        });

    } catch (error) {
        console.error("Error sending invite:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const acceptInviteForExistingUser = async (req: Request, res: Response) => {
    try {
        console.log("req.user==>", req.user);
        const { token } = req.body;
        const userId = Number((req.user as any)?.userId);

        if (!token) {
            return res.status(400).json({ message: "Invite token is required" });
        }

        if (!userId) {
            return res.status(401).json({
                message: "User not authenticated. Please login first."
            });
        }

        // Fetch invite
        const invite = await prisma.emailInvite.findUnique({
            where: { token },
            include: { project: true }
        });

        if (!invite) {
            return res.status(404).json({ message: "Invalid invite token" });
        }

        if (invite.status !== EmailInviteStatus.PENDING) {
            return res.status(400).json({ message: "Invite already accepted or expired" });
        }

        if (new Date() > invite.expiresAt) {
            return res.status(400).json({ message: "Invite expired" });
        }

        // Ensure user email matches invite email
        const user = await prisma.user.findUnique({ where: { userId } });

        if (!user || user.email !== invite.email) {
            return res.status(400).json({
                message: "This invite was not sent to your email. Please login with correct account."
            });
        }

        // Get or create user profile
        let profile = await prisma.userProfile.findFirst({
            where: { userId: user.userId }
        });



        // Add to project
        await prisma.projectUserProfile.create({
            data: {
                projectId: invite.projectId!,
                userProfileId: profile?.userProfileId!,
                tenantId: invite?.project?.tenantId!,
                accessibility: (invite.details as any)?.accessLevel
            }
        });

        // Mark invite as accepted
        await prisma.emailInvite.update({
            where: { emailInviteId: invite.emailInviteId },
            data: { status: EmailInviteStatus.ACCEPTED }
        });

        return res.json({
            success: true,
            message: "Project invite accepted successfully",
        });

    } catch (error) {
        console.error("Error accepting invite:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



export const validateInvite = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const invite = await prisma.emailInvite.findUnique({
            where: { token },
        });

        if (!invite) {
            return res.status(404).json({ valid: false, message: 'Invalid invite token' });
        }

        if (invite.status !== EmailInviteStatus.PENDING) {
            return res.status(400).json({ valid: false, message: 'Invite already accepted or expired' });
        }

        if (new Date() > invite.expiresAt) {
            return res.status(400).json({ valid: false, message: 'Invite expired' });
        }

        res.json({
            success: true,
            data: {
                valid: true,
                invite
            }
        });
    } catch (error: any) {
        console.error('Error validating invite:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllInvites = async (req: Request, res: Response) => {
    const { projectId } = req.query;
    if (!projectId) {
        return res.status(400).json({ message: 'projectId query parameter is required' });
    }
    try {
        const invites = await prisma.emailInvite.findMany({
            where: {
                type: {
                    in: [EmailInviteType.PROJECT_INVITE, EmailInviteType.PROJECT_INVITE_AND_REGISTER]
                }, projectId: parseInt(projectId! as string)
            }
        });

        res.json({
            success: true,
            data: invites
        });
    } catch (error: any) {
        console.error('Error fetching invites:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const acceptUserInvite = async (req: Request, res: Response) => {
    try {
        const { token, name, password } = req.body;

        const invite = await prisma.emailInvite.findUnique({
            where: {
                token,
                type: {
                    in: [EmailInviteType.PROJECT_INVITE, EmailInviteType.PROJECT_INVITE_AND_REGISTER]
                },
            },
            include: { project: true }
        });


        if (!invite || invite.status !== EmailInviteStatus.PENDING || new Date() > invite.expiresAt) {
            return res.status(400).json({ message: 'Invalid or expired invite' });
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: invite.email }
        });

        let userProfile;

        if (user) {
            // Update existing user if needed (e.g. set password if not set)
            if (!user.password && password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                user = await prisma.user.update({
                    where: { userId: user.userId },
                    data: { password: hashedPassword, name, isVerified: true }
                });
            }

            // Find or create user profile
            userProfile = await prisma.userProfile.findFirst({
                where: { userId: user.userId }
            });

            if (!userProfile) {
                userProfile = await prisma.userProfile.create({
                    data: {
                        userId: user.userId,
                        name: name || user.name || 'User',
                        role: 'CLIENT',
                        // tenantId: invite.project.tenantId // Assuming tenant context
                    }
                });
            }

        } else {
            // Create new user
            console.log("password==>", password)
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await prisma.user.create({
                data: {
                    email: invite.email,
                    password: hashedPassword,
                    name,
                    isVerified: true
                }
            });

            userProfile = await prisma.userProfile.create({
                data: {
                    userId: user.userId,
                    name,
                    role: 'CLIENT',
                    // tenantId: invite.project.tenantId
                }
            });
        }

        // Add user to project
        await prisma.projectUserProfile.create({
            data: {
                projectId: invite.projectId!,
                userProfileId: userProfile.userProfileId,
                tenantId: invite?.project?.tenantId!,
                accessibility: (invite?.details as {
                    accessLevel: Accessibility
                })?.accessLevel
            }
        });

        // Update invite status
        await prisma.emailInvite.update({
            where: { emailInviteId: invite.emailInviteId },
            data: { status: EmailInviteStatus.ACCEPTED }
        });

        // Generate JWT token for login
        const jwtToken = jwt.sign(
            { userId: user.userId, email: user.email, role: userProfile.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        const data = await AuthService.loginUser({
            email: invite.email, password
        });

        res.json({
            success: true,
            message: 'Invite accepted successfully',
            data: data
        });
    } catch (error: any) {
        console.error('Error accepting invite:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
