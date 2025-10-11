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
      type: 'uuid',
      nullable: false,
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
