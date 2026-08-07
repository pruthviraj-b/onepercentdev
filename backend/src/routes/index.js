const registerCourseController = require('../controllers/CourseController');
const registerLearningController = require('../controllers/LearningController');
const registerTaskController = require('../controllers/TaskController');
const registerAdminController = require('../controllers/AdminController');
const registerAdminStudentController = require('../controllers/AdminStudentController');
const registerNotificationController = require('../controllers/NotificationController');
const registerSmartTaskController = require('../controllers/SmartTaskController');
const registerReaderController = require('../controllers/ReaderController');
const registerAnalyticsController = require('../controllers/AnalyticsController');
const registerHealthController = require('../controllers/HealthController');
const registerAIController = require('../controllers/AIController');
const registerTTSController = require('../controllers/TTSController');

module.exports = function registerRoutes(context) {
  registerCourseController(context);
  registerLearningController(context);
  registerTaskController(context);
  registerAdminController(context);
  registerAdminStudentController(context);
  registerNotificationController(context);
  registerSmartTaskController(context);
  registerReaderController(context);
  registerAnalyticsController(context);
  registerAIController(context);
  registerTTSController(context);
  registerHealthController(context);
};
