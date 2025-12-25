const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Quiz',
  tableName: 'quizz',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    name: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    teacher_id: {
      type: 'varchar',
      length: 255,
      nullable: false,
    },
    total_time: {
      type: 'integer',
      nullable: true,
      comment: 'Total time to complete quiz in seconds',
    },
    total_question: {
      type: 'integer',
      nullable: false,
      default: 0,
      comment: 'Total number of questions in quiz',
    },
    created_at: {
      type: 'timestamp',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'timestamp',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    },
  },
  relations: {
    classQuizzes: {
      type: 'one-to-many',
      target: 'ClassQuiz',
      inverseSide: 'quiz',
      cascade: true,
    },
    quizQuestions: {
      type: 'one-to-many',
      target: 'QuizQuestion',
      inverseSide: 'quiz',
      cascade: true,
    },
  },
});
