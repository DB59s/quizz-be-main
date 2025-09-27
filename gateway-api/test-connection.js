const AppDataSource = require('./src/config/data-source');

/**
 * Script test kết nối database
 * Chạy: node test-connection.js
 */
async function testConnection() {
  try {
    console.log('🔌 Đang test kết nối database...');
    
    // Kết nối database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Kết nối database thành công');
    }

    // Test query đơn giản
    const accountRepo = AppDataSource.getRepository('Account');
    const count = await accountRepo.count();
    console.log(`📊 Tổng số tài khoản trong database: ${count}`);

    // Kiểm tra tài khoản admin đã tồn tại chưa
    const adminAccount = await accountRepo.findOne({ 
      where: { email: 'vuduy050903@gmail.com' }
    });

    if (adminAccount) {
      console.log('👤 Tài khoản admin đã tồn tại:');
      console.log(`   ID: ${adminAccount.id}`);
      console.log(`   Email: ${adminAccount.email}`);
      console.log(`   Role: ${adminAccount.role}`);
      console.log(`   Status: ${adminAccount.status}`);
      console.log(`   Created: ${adminAccount.created_at}`);
    } else {
      console.log('❌ Tài khoản admin chưa tồn tại');
    }

    console.log('✅ Test kết nối thành công!');

  } catch (error) {
    console.error('❌ Lỗi khi test kết nối:', error.message);
    console.error('Chi tiết lỗi:', error);
    process.exit(1);
  } finally {
    // Đóng kết nối database
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Đã đóng kết nối database');
    }
  }
}

// Chạy test
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('\n✨ Test hoàn thành!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test thất bại:', error.message);
      process.exit(1);
    });
}

module.exports = { testConnection };
