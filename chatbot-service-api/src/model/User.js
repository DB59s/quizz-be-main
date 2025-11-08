// User model for business logic
class User {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.email = data.email || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  // Validation methods
  validate() {
    const errors = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (!this.email || this.email.trim().length === 0) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Email format is invalid');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper method to validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert to plain object for API response
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create model from entity data
  static fromEntity(entityData) {
    return new User(entityData);
  }

  // Prepare data for entity creation/update
  toEntity() {
    const entityData = {
      name: this.name,
      email: this.email
    };

    if (this.id) {
      entityData.id = this.id;
    }

    return entityData;
  }
}

module.exports = User;
