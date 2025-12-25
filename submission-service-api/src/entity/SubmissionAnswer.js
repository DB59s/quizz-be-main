const { EntitySchema } = require('typeorm');

// SubmissionAnswer entity for TypeORM
const SubmissionAnswer = new EntitySchema({
  name: 'SubmissionAnswer',
  tableName: 'submission_answers',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    submission_id: {
      type: 'uuid',
      nullable: false,
    },
    question_id: {
      type: 'uuid',
      nullable: false,
    },
    selected_answer_id: {
      type: 'uuid',
      nullable: false,
    },
  },
  relations: {
    submission: {
      type: 'many-to-one',
      target: 'Submission',
      joinColumn: {
        name: 'submission_id',
      },
      onDelete: 'CASCADE',
    },
  },
});

module.exports = SubmissionAnswer;
