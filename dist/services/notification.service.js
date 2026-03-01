"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = exports.SponsorService = exports.WebhookService = exports.UploadService = exports.NotificationService = void 0;
const notification_repository_1 = require("../repositories/notification.repository");
const db_1 = __importDefault(require("../config/db"));
const notifRepo = new notification_repository_1.NotificationRepository();
const uploadRepo = new notification_repository_1.UploadRepository();
const webhookRepo = new notification_repository_1.WebhookRepository();
const sponsorRepo = new notification_repository_1.SponsorRepository();
const exportRepo = new notification_repository_1.ExportRepository();
class NotificationService {
    send(userId, title, body, type, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(title === null || title === void 0 ? void 0 : title.trim()))
                throw new Error("Title is required");
            return notifRepo.create(userId, title, body, type, meta);
        });
    }
    notifyTournamentPlayers(tournamentId, title, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield db_1.default.query(`
      SELECT user_id FROM sm.tournament_participants WHERE tournament_id = $1 AND status = 'REGISTERED'
    `, [tournamentId]);
            if (rows.length === 0)
                throw new Error("No participants to notify");
            return notifRepo.bulkCreate(rows.map((r) => r.user_id), title, body);
        });
    }
}
exports.NotificationService = NotificationService;
class UploadService {
    upload(file, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return uploadRepo.create({
                original_name: file.originalname,
                file_path: file.path || file.location || `/uploads/${file.filename}`,
                mime_type: file.mimetype,
                size_bytes: file.size,
            }, userId);
        });
    }
    getFile(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const f = yield uploadRepo.findById(id);
            if (!f)
                throw new Error("File not found");
            return f;
        });
    }
    deleteFile(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield uploadRepo.deleteById(id);
        });
    }
}
exports.UploadService = UploadService;
class WebhookService {
    register(userId, url, events, secret) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(url === null || url === void 0 ? void 0 : url.trim()))
                throw new Error("URL is required");
            return webhookRepo.create(url, events || ['*'], secret || null, userId);
        });
    }
    getLogs(webhookId) {
        return __awaiter(this, void 0, void 0, function* () {
            return webhookRepo.getLogs(webhookId);
        });
    }
}
exports.WebhookService = WebhookService;
class SponsorService {
    addSponsor(tournamentId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = data.name) === null || _a === void 0 ? void 0 : _a.trim()))
                throw new Error("Sponsor name is required");
            return sponsorRepo.create(tournamentId, data);
        });
    }
    getSponsors(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return sponsorRepo.getByTournament(tournamentId);
        });
    }
}
exports.SponsorService = SponsorService;
class ExportService {
    exportCSV(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [participants, matches] = yield Promise.all([
                exportRepo.getParticipantsForCSV(tournamentId),
                exportRepo.getMatchesForCSV(tournamentId),
            ]);
            // Generate CSV strings
            const pHeader = 'Name,Email,Status,Payment,CheckedIn,WaiverSigned,Seed,RegisteredAt\n';
            const pRows = participants.map((p) => `"${p.full_name}","${p.email}","${p.status}","${p.payment_status}",${p.checked_in},${p.waiver_signed},${p.seed || ''},${p.registered_at}`).join('\n');
            const mHeader = 'Round,Status,Court,Time,Player1,Player2,P1Score,P2Score,P1Sets,P2Sets,Winner\n';
            const mRows = matches.map((m) => { var _a, _b, _c, _d; return `"${m.round}","${m.status}","${m.court_number || ''}","${m.scheduled_time || ''}","${m.player1 || ''}","${m.player2 || ''}",${(_a = m.player1_score) !== null && _a !== void 0 ? _a : ''},${(_b = m.player2_score) !== null && _b !== void 0 ? _b : ''},${(_c = m.player1_sets) !== null && _c !== void 0 ? _c : ''},${(_d = m.player2_sets) !== null && _d !== void 0 ? _d : ''},"${m.winner || ''}"`; }).join('\n');
            return {
                participants_csv: pHeader + pRows,
                matches_csv: mHeader + mRows,
                counts: { participants: participants.length, matches: matches.length },
            };
        });
    }
    getReport(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            return exportRepo.getTournamentReport(tournamentId);
        });
    }
}
exports.ExportService = ExportService;
