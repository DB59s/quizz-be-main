// Submission model for business logic
class Submission {
  constructor(data) {
    this.id = data.id || null;
    this.score = data.score || null;
    this.submission_time = data.submission_time || null;
    this.total_time = data.total_time || null;
    this.n_total_true = data.n_total_true || null;
    this.student_id = data.student_id || '';
    this.quizz_class_id = data.quizz_class_id || '';
    this.answers = data.answers || [];
  }

  // Validation methods
  validate() {
    const errors = [];
    
    if (!this.student_id || this.student_id.trim().length === 0) {
      errors.push('Student ID is required');
    }
    
    if (!this.quizz_class_id || this.quizz_class_id.trim().length === 0) {
      errors.push('Quiz Class ID is required');
    }
    
    if (!this.submission_time) {
      errors.push('Submission time is required');
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
      score: this.score,
      submission_time: this.submission_time,
      total_time: this.total_time,
      n_total_true: this.n_total_true,
      student_id: this.student_id,
      quizz_class_id: this.quizz_class_id,
      answers: this.answers
    };
  }

  // Create model from entity data
  static fromEntity(entityData) {
    return new Submission(entityData);
  }

  // Prepare data for entity creation/update
  toEntity() {
    const entityData = {
      score: this.score,
      submission_time: this.submission_time,
      total_time: this.total_time,
      n_total_true: this.n_total_true,
      student_id: this.student_id,
      quizz_class_id: this.quizz_class_id
    };

    if (this.id) {
      entityData.id = this.id;
    }

    return entityData;
  }
}

module.exports = Submission;
