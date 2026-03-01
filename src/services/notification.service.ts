import {
    NotificationRepository, UploadRepository, WebhookRepository,
    SponsorRepository, ExportRepository
} from "../repositories/notification.repository";
import pool from "../config/db";

const notifRepo = new NotificationRepository();
const uploadRepo = new UploadRepository();
const webhookRepo = new WebhookRepository();
const sponsorRepo = new SponsorRepository();
const exportRepo = new ExportRepository();

export class NotificationService {
    async send(userId: string, title: string, body: string, type?: string, meta?: any) {
        if (!title?.trim()) throw new Error("Title is required");
        return notifRepo.create(userId, title, body, type, meta);
    }

    async notifyTournamentPlayers(tournamentId: string, title: string, body: string) {
        const { rows } = await pool.query(`
      SELECT user_id FROM sm.tournament_participants WHERE tournament_id = $1 AND status = 'REGISTERED'
    `, [tournamentId]);
        if (rows.length === 0) throw new Error("No participants to notify");
        return notifRepo.bulkCreate(rows.map((r: any) => r.user_id), title, body);
    }
}

export class UploadService {
    async upload(file: any, userId: string) {
        return uploadRepo.create({
            original_name: file.originalname,
            file_path: file.path || file.location || `/uploads/${file.filename}`,
            mime_type: file.mimetype,
            size_bytes: file.size,
        }, userId);
    }

    async getFile(id: string) {
        const f = await uploadRepo.findById(id);
        if (!f) throw new Error("File not found");
        return f;
    }

    async deleteFile(id: string) {
        await uploadRepo.deleteById(id);
    }
}

export class WebhookService {
    async register(userId: string, url: string, events?: string[], secret?: string) {
        if (!url?.trim()) throw new Error("URL is required");
        return webhookRepo.create(url, events || ['*'], secret || null, userId);
    }

    async getLogs(webhookId: string) {
        return webhookRepo.getLogs(webhookId);
    }
}

export class SponsorService {
    async addSponsor(tournamentId: string, data: any) {
        if (!data.name?.trim()) throw new Error("Sponsor name is required");
        return sponsorRepo.create(tournamentId, data);
    }

    async getSponsors(tournamentId: string) {
        return sponsorRepo.getByTournament(tournamentId);
    }
}

export class ExportService {
    async exportCSV(tournamentId: string) {
        const [participants, matches] = await Promise.all([
            exportRepo.getParticipantsForCSV(tournamentId),
            exportRepo.getMatchesForCSV(tournamentId),
        ]);

        // Generate CSV strings
        const pHeader = 'Name,Email,Status,Payment,CheckedIn,WaiverSigned,Seed,RegisteredAt\n';
        const pRows = participants.map((p: any) =>
            `"${p.full_name}","${p.email}","${p.status}","${p.payment_status}",${p.checked_in},${p.waiver_signed},${p.seed || ''},${p.registered_at}`
        ).join('\n');

        const mHeader = 'Round,Status,Court,Time,Player1,Player2,P1Score,P2Score,P1Sets,P2Sets,Winner\n';
        const mRows = matches.map((m: any) =>
            `"${m.round}","${m.status}","${m.court_number || ''}","${m.scheduled_time || ''}","${m.player1 || ''}","${m.player2 || ''}",${m.player1_score ?? ''},${m.player2_score ?? ''},${m.player1_sets ?? ''},${m.player2_sets ?? ''},"${m.winner || ''}"`
        ).join('\n');

        return {
            participants_csv: pHeader + pRows,
            matches_csv: mHeader + mRows,
            counts: { participants: participants.length, matches: matches.length },
        };
    }

    async getReport(tournamentId: string) {
        return exportRepo.getTournamentReport(tournamentId);
    }
}
