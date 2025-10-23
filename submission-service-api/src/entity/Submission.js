const { EntitySchema } = require('typeorm');

// Submission entity for TypeORM
const Submission = new EntitySchema({
  name: 'Submission',
  tableName: 'submissions',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    score: {
      type: 'float',
      nullable: true,
    },
    submission_time: {
      type: 'timestamp',
      nullable: false,
    },
    total_time: {
      type: 'int',
      nullable: true,
    },
    n_total_true: {
      type: 'int',
      nullable: true,
    },
    student_id: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    class_quiz_id: {
      type: 'uuid',
      nullable: false,
    },
    status: {
      type: 'varchar',
      length: 50,
      default: 'submitted',
      nullable: false,
    },
  },
  relations: {
    answers: {
      type: 'one-to-many',
      target: 'SubmissionAnswer',
      inverseSide: 'submission',
      cascade: true,
    },
  },
});

module.exports = Submission;
