import { Request } from "express";
import { LoggedInUser } from "../types/LoggedInUser";

export interface AuthenticatedRequest extends Request {
  user?: LoggedInUser;
}