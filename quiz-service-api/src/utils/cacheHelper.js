const NodeCache = require('node-cache');

/**
 * Cache for quiz questions
 * TTL: 1 hour (3600 seconds)
 * Check period: 120 seconds
 */
const quizCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone data for better performance
});

/**
 * Get quiz questions from cache
 * @param {string} quizId - Quiz ID
 * @returns {Array|null} - Cached questions or null
 */
function getQuizFromCache(quizId) {
  try {
    const cached = quizCache.get(`quiz_${quizId}`);
    if (cached) {
      console.log(`[Cache] Quiz ${quizId} found in cache`);
      return cached;
    }
    console.log(`[Cache] Quiz ${quizId} not found in cache`);
    return null;
  } catch (error) {
    console.error('[Cache] Error getting from cache:', error);
    return null;
  }
}

/**
 * Set quiz questions to cache
 * @param {string} quizId - Quiz ID
 * @param {Array} questions - Questions data
 * @returns {boolean} - Success status
 */
function setQuizToCache(quizId, questions) {
  try {
    const success = quizCache.set(`quiz_${quizId}`, questions);
    if (success) {
      console.log(`[Cache] Quiz ${quizId} cached successfully`);
    }
    return success;
  } catch (error) {
    console.error('[Cache] Error setting to cache:', error);
    return false;
  }
}

/**
 * Delete quiz from cache
 * @param {string} quizId - Quiz ID
 * @returns {number} - Number of deleted entries
 */
function deleteQuizFromCache(quizId) {
  try {
    const deleted = quizCache.del(`quiz_${quizId}`);
    console.log(`[Cache] Quiz ${quizId} deleted from cache`);
    return deleted;
  } catch (error) {
    console.error('[Cache] Error deleting from cache:', error);
    return 0;
  }
}

/**
 * Clear all cache
 */
function clearCache() {
  try {
    quizCache.flushAll();
    console.log('[Cache] All cache cleared');
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return quizCache.getStats();
}

module.exports = {
  getQuizFromCache,
  setQuizToCache,
  deleteQuizFromCache,
  clearCache,
  getCacheStats
};
