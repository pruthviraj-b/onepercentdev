const PERMISSIONS = Object.freeze([
  'course.read', 'course.create', 'course.edit', 'course.delete',
  'lesson.create', 'lesson.edit', 'lesson.delete',
  'quiz.create', 'quiz.submit',
  'payment.read', 'payment.manage',
  'analytics.view', 'admin.access', 'user.manage',
  'certificate.issue', 'notification.send',
  'community.moderate', 'support.manage',
]);

module.exports = { PERMISSIONS };
