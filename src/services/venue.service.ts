import { VenueRepository, CourtRepository, ScheduleRepository } from "../repositories/venue.repository";
import { TournamentRepository } from "../repositories/tournament.repository";
import { OrganizationRepository } from "../repositories/organization.repository";

export class VenueService {
    private venueRepo = new VenueRepository();
    private courtRepo = new CourtRepository();
    private scheduleRepo = new ScheduleRepository();
    private tournamentRepo = new TournamentRepository();
    private orgRepo = new OrganizationRepository();

    private async requireAdmin(tournamentId: string, userId: string) {
        const t = await this.tournamentRepo.findById(tournamentId);
        if (!t) throw new Error("Tournament not found");
        const ok = await this.orgRepo.verifyMembership(t.organization_id, userId, ["OWNER", "ADMIN"]);
        if (!ok) throw new Error("UNAUTHORIZED");
        return t;
    }

    // Venues
    async createVenue(userId: string, data: any) {
        if (!data.name?.trim()) throw new Error("Venue name is required");
        return this.venueRepo.create(data, userId);
    }

    async getVenue(id: string) {
        const v = await this.venueRepo.findById(id);
        if (!v) throw new Error("Venue not found");
        return v;
    }

    // Courts
    async defineCourts(tournamentId: string, userId: string, venueId: string | null, courts: { name: string; court_number: number }[]) {
        await this.requireAdmin(tournamentId, userId);
        if (!courts?.length) throw new Error("At least one court is required");
        return this.courtRepo.createCourts(tournamentId, venueId, courts);
    }

    // Scheduling
    async autoSchedule(tournamentId: string, userId: string, matchDurationMinutes: number = 30) {
        await this.requireAdmin(tournamentId, userId);
        return this.scheduleRepo.autoSchedule(tournamentId, matchDurationMinutes);
    }

    // Court Occupancy
    async getCourtOccupancy(tournamentId: string) {
        const raw = await this.courtRepo.getCourtOccupancy(tournamentId);
        // Group by court for heatmap
        const map: Record<string, any> = {};
        for (const row of raw) {
            const key = `${row.court_id}`;
            if (!map[key]) map[key] = { court_id: row.court_id, court_name: row.court_name, court_number: row.court_number, status: row.status, slots: [] };
            if (row.match_id) {
                map[key].slots.push({
                    match_id: row.match_id, start_time: row.start_time, end_time: row.end_time,
                    schedule_status: row.schedule_status, match_status: row.match_status,
                    round: row.round, player1_name: row.player1_name, player2_name: row.player2_name,
                });
            }
        }
        return Object.values(map);
    }

    // Specific schedule slot
    async getSchedule(scheduleId: string) {
        const s = await this.scheduleRepo.findById(scheduleId);
        if (!s) throw new Error("Schedule not found");
        return s;
    }
}
