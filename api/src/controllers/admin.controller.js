import { successResponse } from '../lib/http.js';
import * as adminService from '../services/admin.service.js';

export const dashboard = async (req, res) => res.json(successResponse(req, await adminService.getDashboard()));
export const users = async (req, res) => res.json(successResponse(req, await adminService.listUsers()));
export const user = async (req, res) => res.json(successResponse(req, await adminService.getUser(req.validated.params.id)));
export const createUser = async (req, res) => res.status(201).json(successResponse(req, await adminService.createUser(req.user, req.validated.body, req.requestId)));
export const updateUser = async (req, res) => res.json(successResponse(req, await adminService.updateUser(req.user, req.validated.params.id, req.validated.body, req.requestId)));
export const updateUserStatus = async (req, res) => res.json(successResponse(req, await adminService.updateUserStatus(req.user, req.validated.params.id, req.validated.body, req.requestId)));
export const deleteUser = async (req, res) => {
  await adminService.deleteUser(req.user, req.validated.params.id, req.requestId);
  res.json(successResponse(req, { deleted: true }));
};
export const verifications = async (req, res) => res.json(successResponse(req, await adminService.listVerifications()));
export const verification = async (req, res) => res.json(successResponse(req, await adminService.getVerification(req.user, req.validated.params.id, req.requestId)));
export const decideVerification = async (req, res) => {
  await adminService.decideVerification(req.user, req.validated.params.id, req.validated.body, req.requestId);
  res.json(successResponse(req, { decided: true }));
};
export const innovations = async (req, res) => res.json(successResponse(req, await adminService.listInnovations()));
export const createInnovation = async (req, res) => res.status(201).json(successResponse(req, await adminService.createInnovation(req.user, req.validated.body, req.requestId)));
export const decideInnovation = async (req, res) => res.json(successResponse(req, await adminService.decideInnovation(req.user, req.validated.params.id, req.validated.body, req.requestId)));
export const assignExpert = async (req, res) => res.status(201).json(successResponse(req, await adminService.assignExpert(req.user, req.validated.params.id, req.validated.body, req.requestId)));
export const deleteInnovation = async (req, res) => {
  await adminService.deleteInnovation(req.user, req.validated.params.id, req.requestId);
  res.json(successResponse(req, { deleted: true }));
};
export const taxonomies = async (req, res) => res.json(successResponse(req, await adminService.listTaxonomies()));
export const createTaxonomy = async (req, res) => res.status(201).json(successResponse(req, await adminService.createTaxonomy(req.user, req.validated.body, req.requestId)));
export const updateTaxonomy = async (req, res) => res.json(successResponse(req, await adminService.updateTaxonomy(req.user, req.validated.params.id, req.validated.body, req.requestId)));
export const criteria = async (req, res) => res.json(successResponse(req, await adminService.listCriteria()));
export const createCriteria = async (req, res) => res.status(201).json(successResponse(req, await adminService.createCriteria(req.user, req.validated.body, req.requestId)));
export const report = async (req, res) => res.json(successResponse(req, await adminService.getReport()));
export const settings = async (req, res) => res.json(successResponse(req, await adminService.getSettings()));
export const updateSettings = async (req, res) => res.json(successResponse(req, await adminService.updateSettings(req.user, req.validated.body, req.requestId)));
