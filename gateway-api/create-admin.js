const AppDataSource = require('./src/config/data-source');
const { hashPassword } = require('./src/utils/hash');
const { callUserService } = require('./src/middlewares/gateway.middleware');

/**
 * Script để tạo tài khoản admin
 * Chạy: node create-admin.js
 */
async function createAdminAccount() {
  try {
    console.log('🚀 Bắt đầu tạo tài khoản admin...');
    
    // Kết nối database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Kết nối database thành công');
    }

    // Thông tin admin
    const adminData = {
      email: 'vuduy050903@gmail.com',
      password: 'Duy0509@',
      full_name: 'Vũ Quang Duy',
      role: 'admin'
    };

    console.log(`📧 Email: ${adminData.email}`);
    console.log(`👤 Họ tên: ${adminData.full_name}`);
    console.log(`🔑 Role: ${adminData.role}`);

    // Lấy repository
    const accountRepo = AppDataSource.getRepository('Account');

    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingAccount = await accountRepo.findOne({ 
      where: { email: adminData.email }
    });

    if (existingAccount) {
      console.log('⚠️  Tài khoản đã tồn tại!');
      console.log(`   ID: ${existingAccount.id}`);
      console.log(`   Role: ${existingAccount.role}`);
      console.log(`   Status: ${existingAccount.status}`);
      
      // Cập nhật role thành admin nếu chưa phải
      if (existingAccount.role !== 'admin') {
        existingAccount.role = 'admin';
        await accountRepo.save(existingAccount);
        console.log('✅ Đã cập nhật role thành admin');
      }
      
      // Cập nhật password nếu cần
      const newPasswordHash = await hashPassword(adminData.password);
      existingAccount.password_hash = newPasswordHash;
      await accountRepo.save(existingAccount);
      console.log('✅ Đã cập nhật password');
      
      console.log('🎉 Tài khoản admin đã sẵn sàng!');
      return;
    }

    // Hash password
    console.log('🔐 Đang hash password...');
    const passwordHash = await hashPassword(adminData.password);

    // Tạo tài khoản trong gateway
    console.log('👤 Đang tạo tài khoản trong gateway...');
    const newAccount = accountRepo.create({
      email: adminData.email,
      password_hash: passwordHash,
      provider: 'local',
      role: adminData.role,
      status: 'active'
    });

    const savedAccount = await accountRepo.save(newAccount);
    console.log(`✅ Tài khoản gateway đã tạo với ID: ${savedAccount.id}`);

    // Tạo user trong user service
    console.log('👤 Đang tạo user trong user service...');
    try {
      const userServiceResponse = await callUserService('POST', '/api/v1/users', {
        account_id: savedAccount.id,
        email: savedAccount.email,
        role: savedAccount.role,
        full_name: adminData.full_name,
        student_code: null // Admin không cần student_code
      });

      console.log('✅ User đã được tạo trong user service');
      console.log('🎉 Tài khoản admin đã được tạo thành công!');
      
      console.log('\n📋 Thông tin tài khoản:');
      console.log(`   ID: ${savedAccount.id}`);
      console.log(`   Email: ${savedAccount.email}`);
      console.log(`   Họ tên: ${adminData.full_name}`);
      console.log(`   Role: ${savedAccount.role}`);
      console.log(`   Status: ${savedAccount.status}`);
      console.log(`   Password: ${adminData.password}`);

    } catch (serviceError) {
      console.error('❌ Lỗi khi tạo user trong user service:', serviceError.message);
      
      // Rollback: Xóa tài khoản gateway
      await accountRepo.remove(savedAccount);
      console.log('🔄 Đã rollback tài khoản gateway');
      
      throw serviceError;
    }

  } catch (error) {
    console.error('❌ Lỗi khi tạo tài khoản admin:', error);
    process.exit(1);
  } finally {
    // Đóng kết nối database
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Đã đóng kết nối database');
    }
  }
}

// Chạy script
if (require.main === module) {
  createAdminAccount()
    .then(() => {
      console.log('\n✨ Hoàn thành!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script thất bại:', error.message);
      process.exit(1);
    });
}

module.exports = { createAdminAccount };
