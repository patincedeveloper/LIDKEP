import { successResponse } from '../lib/http.js';
import * as engagementsService from '../services/engagements.service.js';

export const list = async (req, res) => res.json(successResponse(req, await engagementsService.listEngagements(req.user)));
export const show = async (req, res) => res.json(successResponse(req, await engagementsService.getEngagement(req.user, req.validated.params.engagementId)));
export const create = async (req, res) => res.status(201).json(successResponse(req, await engagementsService.createEngagement(req.user, req.validated.body, req.requestId)));
export const respond = async (req, res) => res.json(successResponse(req, await engagementsService.respondToEngagement(req.user, req.validated.params.engagementId, req.validated.body, req.requestId)));
export const withdraw = async (req, res) => res.json(successResponse(req, await engagementsService.withdrawEngagement(req.user, req.validated.params.engagementId, req.requestId)));
