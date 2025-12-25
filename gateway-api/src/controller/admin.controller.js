const AppDataSource = require('../config/data-source');
const { hashPassword } = require('../utils/hash');
const { callUserService } = require('../middlewares/gateway.middleware');
const { ACCOUNT_STATUS, ROLES } = require('../utils/constants');

// Get repositories
const getAccountRepository = () => AppDataSource.getRepository('Account');

/**
 * Create teacher account (Admin only)
 * POST /admin/teachers
 */
async function createTeacher(req, res) {
  let savedAccount = null;
  
  try {
    const { email, password, full_name, department } = req.body;

    // Validate input
    if (!email || !password || !full_name || !department) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email, password, full name and department are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long'
      });
    }

    const accountRepo = getAccountRepository();

    // Check if email already exists
    const existingAccount = await accountRepo.findOne({ where: { email } });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create teacher account
    const newAccount = accountRepo.create({
      email,
      password_hash,
      provider: 'local',
      role: 'teacher',
      status: 'active'
    });

    savedAccount = await accountRepo.save(newAccount);
    console.log(`New teacher account created: ${email} with ID: ${savedAccount.id}`);

    // Create teacher in user service
    try {
      const userServiceResponse = await callUserService('POST', '/users', {
        account_id: savedAccount.id,
        email: savedAccount.email,
        role: savedAccount.role,
        full_name: full_name,
        department: department
      });

      console.log(`Teacher created in user service for account: ${savedAccount.id}`);
    } catch (serviceError) {
      console.error(`Failed to create teacher in user service:`, serviceError.message);
      
      // Rollback: Delete the account from gateway
      await accountRepo.remove(savedAccount);
      console.log(`Rolled back teacher account creation for: ${email}`);
      
      return res.status(500).json({
        success: false,
        error: 'Teacher creation failed',
        message: serviceError.response?.message || 'Failed to create teacher profile. Please try again.'
      });
    }

    console.log(`Teacher account created successfully: ${email} with role: teacher`);

    // Return response
    res.status(201).json({
      success: true,
      message: 'Teacher account created successfully',
      user: {
        id: savedAccount.id,
        email: savedAccount.email,
        role: savedAccount.role,
        full_name: full_name,
        department: department
      }
    });

  } catch (error) {
    console.error('Create teacher error:', error);
    
    // Additional rollback if something went wrong after user service call
    if (savedAccount) {
      try {
        const accountRepo = getAccountRepository();
        await accountRepo.remove(savedAccount);
        console.log(`Emergency rollback completed for teacher account: ${savedAccount.id}`);
      } catch (rollbackError) {
        console.error('Failed to rollback teacher account:', rollbackError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create teacher account'
    });
  }
}

/**
 * Create admin account (Admin only)
 * POST /admin/admins
 */
async function createAdmin(req, res) {
  let savedAccount = null;
  
  try {
    const { email, password, full_name } = req.body;

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email, password and full name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long'
      });
    }

    const accountRepo = getAccountRepository();

    // Check if email already exists
    const existingAccount = await accountRepo.findOne({ where: { email } });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create admin account
    const newAccount = accountRepo.create({
      email,
      password_hash,
      provider: 'local',
      role: 'admin',
      status: 'active'
    });

    savedAccount = await accountRepo.save(newAccount);
    console.log(`New admin account created: ${email} with ID: ${savedAccount.id}`);

    // Create admin in user service
    try {
      const userServiceResponse = await callUserService('POST', '/users', {
        account_id: savedAccount.id,
        email: savedAccount.email,
        role: savedAccount.role,
        full_name: full_name
      });

      console.log(`Admin created in user service for account: ${savedAccount.id}`);
    } catch (serviceError) {
      console.error(`Failed to create admin in user service:`, serviceError.message);
      
      // Rollback: Delete the account from gateway
      await accountRepo.remove(savedAccount);
      console.log(`Rolled back admin account creation for: ${email}`);
      
      return res.status(500).json({
        success: false,
        error: 'Admin creation failed',
        message: serviceError.response?.message || 'Failed to create admin profile. Please try again.'
      });
    }

    console.log(`Admin account created successfully: ${email} with role: admin`);

    // Return response
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: savedAccount.id,
        email: savedAccount.email,
        role: savedAccount.role,
        full_name: full_name
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    
    // Additional rollback if something went wrong after user service call
    if (savedAccount) {
      try {
        const accountRepo = getAccountRepository();
        await accountRepo.remove(savedAccount);
        console.log(`Emergency rollback completed for admin account: ${savedAccount.id}`);
      } catch (rollbackError) {
        console.error('Failed to rollback admin account:', rollbackError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create admin account'
    });
  }
}

/**
 * Get pending teacher accounts (Admin only)
 * GET /admin/teachers/pending
 */
async function getPendingTeachers(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const accountRepo = getAccountRepository();
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Find pending teacher accounts
    const [pendingTeachers, total] = await accountRepo.findAndCount({
      where: { 
        role: ROLES.TEACHER,
        status: ACCOUNT_STATUS.PENDING
      },
      order: { created_at: 'DESC' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });
    
    // Get teacher details from user service for each account
    const teachersWithDetails = await Promise.all(
      pendingTeachers.map(async (account) => {
        try {
          const teacherDetails = await callUserService('GET', `/teacher/${account.id}`);
          return {
            id: account.id,
            email: account.email,
            role: account.role,
            status: account.status,
            created_at: account.created_at,
            teacher_details: teacherDetails.data
          };
        } catch (error) {
          console.error(`Failed to fetch teacher details for account ${account.id}:`, error.message);
          return {
            id: account.id,
            email: account.email,
            role: account.role,
            status: account.status,
            created_at: account.created_at,
            teacher_details: null
          };
        }
      })
    );
    
    res.status(200).json({
      success: true,
      message: 'Pending teachers retrieved successfully',
      data: teachersWithDetails,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get pending teachers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve pending teachers'
    });
  }
}

/**
 * Approve teacher account (Admin only)
 * PUT /admin/teachers/:account_id/approve
 */
async function approveTeacher(req, res) {
  try {
    const { account_id } = req.params;
    
    const accountRepo = getAccountRepository();
    
    // Find the teacher account
    const account = await accountRepo.findOne({ 
      where: { 
        id: account_id,
        role: ROLES.TEACHER
      } 
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found',
        message: 'Teacher account not found'
      });
    }
    
    // Check if account is pending
    if (account.status !== ACCOUNT_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Teacher account is already ${account.status}. Only pending accounts can be approved.`
      });
    }
    
    // Update account status to active
    account.status = ACCOUNT_STATUS.ACTIVE;
    await accountRepo.save(account);
    
    console.log(`Teacher account approved: ${account.email} (ID: ${account.id})`);
    
    res.status(200).json({
      success: true,
      message: 'Teacher account approved successfully',
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        status: account.status,
        updated_at: account.updated_at
      }
    });
    
  } catch (error) {
    console.error('Approve teacher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to approve teacher account'
    });
  }
}

/**
 * Reject teacher account (Admin only)
 * DELETE /admin/teachers/:account_id/reject
 */
async function rejectTeacher(req, res) {
  try {
    const { account_id } = req.params;
    
    const accountRepo = getAccountRepository();
    
    // Find the teacher account
    const account = await accountRepo.findOne({ 
      where: { 
        id: account_id,
        role: ROLES.TEACHER
      } 
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found',
        message: 'Teacher account not found'
      });
    }
    
    // Check if account is pending
    if (account.status !== ACCOUNT_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Teacher account is ${account.status}. Only pending accounts can be rejected.`
      });
    }
    
    // Delete teacher from user service first
    try {
      await callUserService('DELETE', `/users/teacher/${account.id}`);
      console.log(`Teacher deleted from user service: ${account.id}`);
    } catch (serviceError) {
      console.error(`Failed to delete teacher from user service:`, serviceError.message);
      // Continue with account deletion even if user service fails
    }
    
    // Delete the account
    await accountRepo.remove(account);
    
    console.log(`Teacher account rejected and deleted: ${account.email} (ID: ${account.id})`);
    
    res.status(200).json({
      success: true,
      message: 'Teacher account rejected and deleted successfully'
    });
    
  } catch (error) {
    console.error('Reject teacher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to reject teacher account'
    });
  }
}

module.exports = {
  createTeacher,
  createAdmin,
  getPendingTeachers,
  approveTeacher,
  rejectTeacher
};
