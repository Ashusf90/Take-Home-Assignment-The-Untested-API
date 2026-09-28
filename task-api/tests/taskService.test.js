const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    test('should create a task with default values', () => {
      const task = taskService.create({
        title: 'Learn Jest',
      });





      expect(task).toMatchObject({
        title: 'Learn Jest',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        completedAt: null,
      });

      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
    });

    test('should create a task with provided values', () => {
      const task = taskService.create({
        title: 'Build API',
        description: 'Complete the assignment',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-10-01T00:00:00.000Z',
      });

      expect(task).toMatchObject({
        title: 'Build API',
        description: 'Complete the assignment',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-10-01T00:00:00.000Z',
        completedAt: null,
      });
    });
  });

  describe('getAll', () => {
    test('should return all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const tasks = taskService.getAll();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });
  });

  describe('findById', () => {
    test('should return a task when the id exists', () => {
      const created = taskService.create({ title: 'Find me' });

      const found = taskService.findById(created.id);

      expect(found).toEqual(created);
    });

    test('should return undefined when the id does not exist', () => {
      const result = taskService.findById('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    test('should return tasks matching the status', () => {
      taskService.create({ title: 'Todo task', status: 'todo' });
      taskService.create({ title: 'Done task', status: 'done' });

      const result = taskService.getByStatus('todo');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Todo task');
    });
  });

  describe('getPaginated', () => {
    test('should return tasks for the requested page', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const result = taskService.getPaginated(1, 2);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Task 1');
      expect(result[1].title).toBe('Task 2');
    });
  });

  describe('update', () => {
    test('should update an existing task', () => {
      const created = taskService.create({
        title: 'Original title',
      });

      const updated = taskService.update(created.id, {
        title: 'Updated title',
      });

      expect(updated.title).toBe('Updated title');
      expect(updated.id).toBe(created.id);
    });


    test('should return null when updating a non-existent task', () => {
      const result = taskService.update('non-existent-id', {
        title: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    test('should remove an existing task', () => {
      const created = taskService.create({
        title: 'Delete me',
      });


      const result = taskService.remove(created.id);

      expect(result).toBe(true);
      expect(taskService.findById(created.id)).toBeUndefined();
    });





    test('should return false for a non-existent task', () => {
      const result = taskService.remove('non-existent-id');

      expect(result).toBe(false);
    });
  });




  describe('completeTask', () => {
    test('should mark a task as completed', () => {
      const created = taskService.create({
        title: 'Complete me',
        priority: 'high',
      });
      const completed = taskService.completeTask(created.id);
      expect(completed.status).toBe('done');
      expect(completed.priority).toBe('medium');
      expect(completed.completedAt).toBeDefined();
    });
    test('should return null for a non-existent task', () => {
      const result = taskService.completeTask('non-existent-id');

      expect(result).toBeNull();
    });
  });
    describe('assignTask', () => {
    test('should assign a task to a user', () => {
      const task = taskService.create({
        title: 'Assign me',
      });

      const updated = taskService.assignTask(task.id, 'Ashu');

      expect(updated.assignee).toBe('Ashu');
      expect(updated.id).toBe(task.id);
    });

    test('should return null when assigning a non-existent task', () => {
      const result = taskService.assignTask(
        'non-existent-id',
        'Ashu'
      );

      expect(result).toBeNull();
    });

    test('should reject assigning an already assigned task', () => {
      const task = taskService.create({
        title: 'Already assigned',
      });

      taskService.assignTask(task.id, 'First User');

      const result = taskService.assignTask(
        task.id,
        'Second User'
      );

      expect(result).toEqual({
        error: 'Task is already assigned',
      });
    });
  });
});