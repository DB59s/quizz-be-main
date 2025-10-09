/**
 * Constants for Question Service
 */

/**
 * Question difficulty levels
 */
const QUESTION_LEVEL = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  VERY_HARD: 4
};

/**
 * Question level labels (Vietnamese)
 */
const QUESTION_LEVEL_LABELS = {
  [QUESTION_LEVEL.EASY]: 'Dễ',
  [QUESTION_LEVEL.MEDIUM]: 'Trung bình',
  [QUESTION_LEVEL.HARD]: 'Khó',
  [QUESTION_LEVEL.VERY_HARD]: 'Cực khó'
};

/**
 * Question types
 */
const QUESTION_TYPE = {
  SINGLE_CHOICE: 1,
  MULTI_CHOICE: 2
};

/**
 * Question type labels (Vietnamese)
 */
const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPE.SINGLE_CHOICE]: 'Một đáp án',
  [QUESTION_TYPE.MULTI_CHOICE]: 'Nhiều đáp án'
};

/**
 * Validate question level
 * @param {number} level - Level to validate
 * @returns {boolean} True if valid
 */
const isValidLevel = (level) => {
  return Object.values(QUESTION_LEVEL).includes(level);
};

/**
 * Validate question type
 * @param {number} type - Type to validate
 * @returns {boolean} True if valid
 */
const isValidType = (type) => {
  return Object.values(QUESTION_TYPE).includes(type);
};

module.exports = {
  QUESTION_LEVEL,
  QUESTION_LEVEL_LABELS,
  QUESTION_TYPE,
  QUESTION_TYPE_LABELS,
  isValidLevel,
  isValidType
};
