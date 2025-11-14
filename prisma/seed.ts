import { PrismaClient, UserRole, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Sample Photography Studio',
      created_by: 'system'
    }
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create sample enterprise user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const enterpriseUser = await prisma.user.create({
    data: {
      email: 'admin@photostudio.com',
      password: hashedPassword,
      name: 'Studio Admin',
      phone_number: '+1234567890',
      is_verified: true
    }
  });

  const enterpriseProfile = await prisma.userProfile.create({
    data: {
      user_id: enterpriseUser.user_id,
      role: UserRole.ENTERPRISE,
      name: 'Studio Admin',
      tenant_id: tenant.tenant_id,
      created_by: enterpriseUser.user_id
    }
  });

  console.log('✅ Created enterprise user:', enterpriseUser.email);

  // Create sample client user
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@example.com',
      password: hashedPassword,
      name: 'John Client',
      phone_number: '+1234567891',
      is_verified: true
    }
  });

  const clientProfile = await prisma.userProfile.create({
    data: {
      user_id: clientUser.user_id,
      role: UserRole.CLIENT,
      name: 'John Client',
      tenant_id: tenant.tenant_id,
      created_by: enterpriseUser.user_id
    }
  });

  console.log('✅ Created client user:', clientUser.email);

  // Create sample project
  const project = await prisma.project.create({
    data: {
      project_uuid: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: 'Wedding Photography - Smith & Johnson',
      description: 'Beautiful outdoor wedding ceremony and reception photography',
      event_date: new Date('2024-06-15'),
      tenant_id: tenant.tenant_id,
      status: ProjectStatus.ACTIVE,
      is_active: true,
      created_by: enterpriseProfile.user_profile_id
    }
  });

  console.log('✅ Created project:', project.title);

  // Add enterprise user as admin to project
  await prisma.projectUserProfile.create({
    data: {
      project_id: project.project_id,
      user_profile_id: enterpriseProfile.user_profile_id,
      tenant_id: tenant.tenant_id,
      accessibility: 'ADMIN',
      created_by: enterpriseProfile.user_profile_id
    }
  });

  // Add client user as viewer to project
  await prisma.projectUserProfile.create({
    data: {
      project_id: project.project_id,
      user_profile_id: clientProfile.user_profile_id,
      tenant_id: tenant.tenant_id,
      accessibility: 'VIEW_ONLY',
      created_by: enterpriseProfile.user_profile_id
    }
  });

  console.log('✅ Added users to project');

  // Create sample albums
  const ceremonyAlbum = await prisma.album.create({
    data: {
      project_id: project.project_id,
      tenant_id: tenant.tenant_id,
      title: 'Ceremony',
      description: 'Wedding ceremony photos',
      created_by: enterpriseProfile.user_profile_id
    }
  });

  const receptionAlbum = await prisma.album.create({
    data: {
      project_id: project.project_id,
      tenant_id: tenant.tenant_id,
      title: 'Reception',
      description: 'Wedding reception photos',
      created_by: enterpriseProfile.user_profile_id
    }
  });

  console.log('✅ Created albums:', ceremonyAlbum.title, 'and', receptionAlbum.title);

  // Create sample photos (with placeholder S3 data)
  const samplePhotos = [
    {
      album_id: ceremonyAlbum.album_id,
      filename: 'ceremony_001.jpg',
      s3_key: 'photos/ceremony/sample_ceremony_001.jpg',
      s3_url: 'https://sample-bucket.s3.amazonaws.com/photos/ceremony/sample_ceremony_001.jpg',
      file_size: 2048000,
      mime_type: 'image/jpeg',
      width: 1920,
      height: 1080
    },
    {
      album_id: ceremonyAlbum.album_id,
      filename: 'ceremony_002.jpg',
      s3_key: 'photos/ceremony/sample_ceremony_002.jpg',
      s3_url: 'https://sample-bucket.s3.amazonaws.com/photos/ceremony/sample_ceremony_002.jpg',
      file_size: 1856000,
      mime_type: 'image/jpeg',
      width: 1920,
      height: 1080
    },
    {
      album_id: receptionAlbum.album_id,
      filename: 'reception_001.jpg',
      s3_key: 'photos/reception/sample_reception_001.jpg',
      s3_url: 'https://sample-bucket.s3.amazonaws.com/photos/reception/sample_reception_001.jpg',
      file_size: 2156000,
      mime_type: 'image/jpeg',
      width: 1920,
      height: 1080
    }
  ];

  for (const photoData of samplePhotos) {
    await prisma.photo.create({
      data: {
        ...photoData,
        tenant_id: tenant.tenant_id,
        created_by: enterpriseProfile.user_profile_id
      }
    });
  }

  console.log('✅ Created sample photos');

  // Update album cover images
  await prisma.album.update({
    where: { album_id: ceremonyAlbum.album_id },
    data: { cover_image: samplePhotos[0].s3_url }
  });

  await prisma.album.update({
    where: { album_id: receptionAlbum.album_id },
    data: { cover_image: samplePhotos[2].s3_url }
  });

  console.log('✅ Updated album cover images');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample Data Created:');
  console.log(`- Tenant: ${tenant.name}`);
  console.log(`- Enterprise User: ${enterpriseUser.email} (password: password123)`);
  console.log(`- Client User: ${clientUser.email} (password: password123)`);
  console.log(`- Project: ${project.title}`);
  console.log(`- Albums: ${ceremonyAlbum.title}, ${receptionAlbum.title}`);
  console.log(`- Photos: ${samplePhotos.length} sample photos`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




