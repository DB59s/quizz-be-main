const { EntitySchema } = require('typeorm');

// QuizJob entity for async quiz generation
const QuizJob = new EntitySchema({
  name: 'QuizJob',
  tableName: 'quiz_jobs',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    status: {
      type: 'varchar',
      length: 50,
      nullable: false,
      default: 'pending',
      comment: 'pending, processing, completed, failed',
    },
    fileName: {
      type: 'varchar',
      length: 255,
      nullable: true,
    },
    filePath: {
      type: 'text',
      nullable: true,
    },
    totalQuestions: {
      type: 'int',
      nullable: true,
      default: 0,
    },
    processedQuestions: {
      type: 'int',
      nullable: true,
      default: 0,
    },
    currentChunk: {
      type: 'int',
      nullable: true,
      default: 0,
    },
    totalChunks: {
      type: 'int',
      nullable: true,
      default: 0,
    },
    progress: {
      type: 'text',
      nullable: true,
    },
    result: {
      type: 'jsonb',
      nullable: true,
    },
    error: {
      type: 'text',
      nullable: true,
    },
    startedAt: {
      type: 'timestamp',
      nullable: true,
    },
    completedAt: {
      type: 'timestamp',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
});

module.exports = QuizJob;
