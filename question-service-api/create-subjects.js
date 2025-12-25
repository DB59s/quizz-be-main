const { DataSource } = require('typeorm');
const Subject = require('./src/entity/Subject');
const Question = require('./src/entity/Question');
const SubjectQuestion = require('./src/entity/SubjectQuestion');
const Answer = require('./src/entity/Answer');

// Database configuration from environment variables
const AppDataSource = new DataSource({
  type: process.env.DB_TYPE || 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3308,
  username: process.env.DB_USERNAME || 'question_user',
  password: process.env.DB_PASSWORD || 'question_password',
  database: process.env.DB_DATABASE || 'question_db',
  synchronize: false,
  logging: false,
  entities: [Subject, Question, SubjectQuestion, Answer],
});


// List of subjects to create
const subjects = [
  // Lý luận chính trị
  'Triết học Mác – Lênin',
  'Kinh tế chính trị Mác – Lênin',
  'Chủ nghĩa xã hội khoa học',
  'Lịch sử Đảng Cộng sản Việt Nam',
  'Tư tưởng Hồ Chí Minh',
  
  // Toán cao cấp
  'Giải tích',
  'Đại số tuyến tính',
  'Xác suất thống kê',
  
  // Các môn đại cương
  'Vật lý đại cương',
  'Pháp luật đại cương',
  'Giáo dục thể chất',
  'Giáo dục quốc phòng – an ninh',
  
  // Ngoại ngữ
  'Tiếng Anh',
  'Tiếng Nhật',
  
  // Lập trình cơ bản
  'Nhập môn lập trình',
  'Kỹ thuật lập trình',
  'Lập trình hướng đối tượng',
  'Cấu trúc dữ liệu và giải thuật',
  
  // Toán và cơ sở
  'Toán rời rạc',
  'Kiến trúc máy tính',
  'Mạng máy tính',
  'Hệ điều hành',
  'Cơ sở dữ liệu',
  
  // Phân tích và thiết kế
  'Phân tích và thiết kế thuật toán',
  'Công nghệ phần mềm',
  
  // Lập trình ứng dụng
  'Lập trình Web',
  'Lập trình di động',
  'Kiểm thử phần mềm',
  'Quản lý dự án phần mềm',
  'Mẫu thiết kế phần mềm',
  
  // Trí tuệ nhân tạo
  'Trí tuệ nhân tạo',
  'Học máy',
  'Khai phá dữ liệu',
  'Xử lý ngôn ngữ tự nhiên',
  'Thị giác máy tính',
  'Đồ họa máy tính',
  
  // Mạng máy tính nâng cao
  'Quản trị mạng',
  'An toàn và bảo mật mạng',
  'Lập trình mạng',
  'Mạng không dây',
  'Phân tích và thiết kế mạng',
  
  // Hệ thống thông tin
  'Phân tích và thiết kế hệ thống thông tin',
  'Hệ quản trị cơ sở dữ liệu',
  'Kho dữ liệu và Business Intelligence',
  'Hệ thống thông tin quản lý',
  'An toàn và bảo mật hệ thống thông tin',
  
  // Hệ thống nhúng
  'Vi xử lý và vi điều khiển',
  'Thiết kế hệ thống nhúng',
  'Lập trình hệ thống',
  'Mạch số',
  
  // Đồ án và tốt nghiệp
  'Đồ án chuyên ngành',
  'Thực tập tốt nghiệp',
  'Khóa luận tốt nghiệp',
  
  // Kỹ năng mềm
  'Kỹ năng giao tiếp',
  'Kỹ năng làm việc nhóm',
  'Kỹ năng thuyết trình',
];

async function createSubjects() {
  console.log('=== SUBJECT CREATION SCRIPT ===');
  console.log(`Database: ${process.env.DB_TYPE || 'mysql'}`);
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  console.log(`Database Name: ${process.env.DB_DATABASE || 'question_db'}`);
  console.log('================================\n');

  try {
    // Initialize database connection
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✓ Database connected successfully!\n');

    const subjectRepository = AppDataSource.getRepository(Subject);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`Creating ${subjects.length} subjects...\n`);

    for (const subjectName of subjects) {
      try {
        // Check if subject already exists
        const existingSubject = await subjectRepository.findOne({
          where: { name: subjectName }
        });

        if (existingSubject) {
          console.log(`⊘ Skipped: "${subjectName}" (already exists)`);
          skippedCount++;
          continue;
        }

        // Create new subject
        const newSubject = subjectRepository.create({
          name: subjectName
        });

        await subjectRepository.save(newSubject);
        console.log(`✓ Created: "${subjectName}"`);
        createdCount++;

      } catch (error) {
        console.error(`✗ Error creating "${subjectName}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total subjects: ${subjects.length}`);
    console.log(`✓ Created: ${createdCount}`);
    console.log(`⊘ Skipped: ${skippedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log('================\n');

    if (createdCount > 0) {
      console.log('✓ Subject creation completed successfully!');
    } else if (skippedCount === subjects.length) {
      console.log('⊘ All subjects already exist in the database.');
    } else {
      console.log('⚠ Subject creation completed with some issues.');
    }

    // Close database connection
    await AppDataSource.destroy();
    console.log('\n✓ Database connection closed.');
    
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

// Run the script
createSubjects();
