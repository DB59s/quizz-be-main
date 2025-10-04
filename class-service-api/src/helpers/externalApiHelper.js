const axios = require('axios');
const env = require('../config/env');

/**
 * Call external user service to get teacher information
 * @param {string} teacherId - The teacher's ID
 * @returns {Promise<Object>} Teacher information
 */
const getTeacherInfo = async (teacherId) => {
  try {
    const response = await axios.get(
      `${env.USER_SERVICE_BASEURL}/teacher/account/${teacherId}`,
      {
        headers: {
          'Authorization': `Bearer ${env.USER_SERVICE_API_TOKEN}`
        },
        timeout: 5000 // 5 seconds timeout
      }
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from user service');
  } catch (error) {
    console.error('Get teacher info error:', error.message);
    
    // Return null if teacher info cannot be retrieved
    // This allows the class info to still be returned without teacher details
    if (error.response) {
      console.error('User service response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('User service no response received');
    }
    
    return null;
  }
};

/**
 * Call external user service to get student information
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object>} Student information
 */
const getStudentInfo = async (studentId) => {
  try {
    const response = await axios.get(
      `${env.USER_SERVICE_BASEURL}/student/account/${studentId}`,
      {
        headers: {
          'Authorization': `Bearer ${env.USER_SERVICE_API_TOKEN}`
        },
        timeout: 5000 // 5 seconds timeout
      }
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error('Invalid response format from user service');
  } catch (error) {
    console.error('Get student info error:', error.message);
    
    // Return null if student info cannot be retrieved
    // This allows the registration to still be returned without student details
    if (error.response) {
      console.error('User service response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('User service no response received');
    }
    
    return null;
  }
};

module.exports = {
  getTeacherInfo,
  getStudentInfo
};
