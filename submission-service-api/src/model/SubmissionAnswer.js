// SubmissionAnswer model for business logic
class SubmissionAnswer {
  constructor(data) {
    this.id = data.id || null;
    this.submission_id = data.submission_id || '';
    this.answer_id = data.answer_id || '';
    this.question_id = data.question_id || '';
  }

  // Validation methods
  validate() {
    const errors = [];
    
    if (!this.submission_id || this.submission_id.trim().length === 0) {
      errors.push('Submission ID is required');
    }
    
    if (!this.answer_id || this.answer_id.trim().length === 0) {
      errors.push('Answer ID is required');
    }
    
    if (!this.question_id || this.question_id.trim().length === 0) {
      errors.push('Question ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Convert to plain object for API response
  toJSON() {
    return {
      id: this.id,
      submission_id: this.submission_id,
      answer_id: this.answer_id,
      question_id: this.question_id
    };
  }

  // Create model from entity data
  static fromEntity(entityData) {
    return new SubmissionAnswer(entityData);
  }

  // Prepare data for entity creation/update
  toEntity() {
    const entityData = {
      submission_id: this.submission_id,
      answer_id: this.answer_id,
      question_id: this.question_id
    };

    if (this.id) {
      entityData.id = this.id;
    }

    return entityData;
  }
}

module.exports = SubmissionAnswer;
