import { Request, Response } from "express";
import { MatchService } from "../services/match.service";
import { AuthenticatedRequest } from "../types/AuthenticatedRequest";
import { Server as SocketServer } from "socket.io";

let matchService: MatchService;

export const initMatchService = (io: SocketServer) => {
  matchService = new MatchService(io);
};

const getService = () => matchService || new MatchService();

// --------------------------------------------------
// PUBLIC
// --------------------------------------------------

export const getTournamentMatches = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string | undefined; // undefined when hitting /api/matches
    const { round, court } = req.query;
    let data;
    if (id) {
      data = await getService().getMatchesForTournament(id, {
        round: round as string,
        court: court as string,
      });
    } else {
      data = await getService().getAllMatches({
        round: round as string,
        court: court as string,
      });
    }
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getMatch = async (req: Request, res: Response) => {
  try {
    const data = await getService().getMatchById(req.params.id as string);
    res.json({ success: true, data });
  } catch (e: any) {
    res.status(404).json({ success: false, message: e.message });
  }
};

// --------------------------------------------------
// BRACKET GENERATION
// --------------------------------------------------

export const generateBracket = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = req.params.id as string;
    const { round = "Round 1" } = req.body;
    const data = await getService().generateBracket(id, req.user!.id, round);
    res.status(201).json({ success: true, message: "Bracket generated", data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

// --------------------------------------------------
// MATCH ADMINISTRATION
// --------------------------------------------------

export const updateMatchMeta = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const data = await getService().updateMatchMeta(
      req.params.id as string,
      req.user!.id,
      req.body,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

export const assignUmpire = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { umpireId } = req.body;
    const data = await getService().assignUmpire(
      req.params.id as string,
      req.user!.id,
      umpireId,
    );
    res.json({ success: true, message: "Umpire assigned", data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

export const updateMatchStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { status } = req.body;
    const data = await getService().updateStatus(
      req.params.id as string,
      req.user!.id,
      status,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

export const cancelMatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await getService().cancelMatch(
      req.params.id as string,
      req.user!.id,
    );
    res.json({ success: true, message: "Match cancelled", data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

// --------------------------------------------------
// SCORING
// --------------------------------------------------

export const updateScore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await getService().updateScore(
      req.params.id as string,
      req.user!.id,
      req.body,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

export const confirmResult = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { winnerId } = req.body;
    const data = await getService().confirmResult(
      req.params.id as string,
      req.user!.id,
      winnerId,
    );
    res.json({ success: true, message: "Result confirmed", data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

// --------------------------------------------------
// DISPUTES
// --------------------------------------------------

export const raiseDispute = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { reason } = req.body;
    const data = await getService().raiseDispute(
      req.params.id as string,
      req.user!.id,
      reason,
    );
    res.status(201).json({ success: true, message: "Dispute raised", data });
  } catch (e: any) {
    res
      .status(e.message.includes("UNAUTHORIZED") ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};

export const resolveDispute = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { status, notes } = req.body;
    const data = await getService().resolveDispute(
      req.params.id as string,
      req.user!.id,
      status,
      notes,
    );
    res.json({ success: true, message: "Dispute resolved", data });
  } catch (e: any) {
    res
      .status(e.message === "UNAUTHORIZED" ? 403 : 400)
      .json({ success: false, message: e.message });
  }
};
