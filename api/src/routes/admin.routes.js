import { Router } from "express";
import * as controller from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  adminEmptySchema,
  adminIdSchema,
  assignExpertSchema,
  createAdminInnovationSchema,
  createCriteriaSchema,
  createTaxonomySchema,
  createUserSchema,
  decideInnovationSchema,
  decideVerificationSchema,
  updateSettingsSchema,
  updateTaxonomySchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "../validators/admin.validator.js";

export const adminRouter = Router();
adminRouter.use(authenticate, authorize("SYSTEM_ADMINISTRATOR"));

adminRouter.get("/dashboard", validate(adminEmptySchema), controller.dashboard);
adminRouter.get("/users", validate(adminEmptySchema), controller.users);
adminRouter.post("/users", validate(createUserSchema), controller.createUser);
adminRouter.get("/users/:id", validate(adminIdSchema), controller.user);
adminRouter.put(
  "/users/:id",
  validate(updateUserSchema),
  controller.updateUser,
);
adminRouter.patch(
  "/users/:id/status",
  validate(updateUserStatusSchema),
  controller.updateUserStatus,
);
adminRouter.delete(
  "/users/:id",
  validate(adminIdSchema),
  controller.deleteUser,
);
adminRouter.get(
  "/verifications",
  validate(adminEmptySchema),
  controller.verifications,
);
adminRouter.get(
  "/verifications/:id",
  validate(adminIdSchema),
  controller.verification,
);
adminRouter.post(
  "/verifications/:id/decision",
  validate(decideVerificationSchema),
  controller.decideVerification,
);
adminRouter.get(
  "/innovations",
  validate(adminEmptySchema),
  controller.innovations,
);
adminRouter.post(
  "/innovations",
  validate(createAdminInnovationSchema),
  controller.createInnovation,
);
adminRouter.post(
  "/innovations/:id/decision",
  validate(decideInnovationSchema),
  controller.decideInnovation,
);
adminRouter.post(
  "/innovations/:id/assignments",
  validate(assignExpertSchema),
  controller.assignExpert,
);
adminRouter.delete(
  "/innovations/:id",
  validate(adminIdSchema),
  controller.deleteInnovation,
);
adminRouter.get(
  "/taxonomies",
  validate(adminEmptySchema),
  controller.taxonomies,
);
adminRouter.post(
  "/taxonomies",
  validate(createTaxonomySchema),
  controller.createTaxonomy,
);
adminRouter.patch(
  "/taxonomies/:id",
  validate(updateTaxonomySchema),
  controller.updateTaxonomy,
);
adminRouter.get("/criteria", validate(adminEmptySchema), controller.criteria);
adminRouter.post(
  "/criteria",
  validate(createCriteriaSchema),
  controller.createCriteria,
);
adminRouter.get(
  "/reports/summary",
  validate(adminEmptySchema),
  controller.report,
);
adminRouter.get("/settings", validate(adminEmptySchema), controller.settings);
adminRouter.put(
  "/settings",
  validate(updateSettingsSchema),
  controller.updateSettings,
);
