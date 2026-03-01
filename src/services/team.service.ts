import { TeamRepository } from '../repositories/team.repository';

export class TeamService {
    private repo = new TeamRepository();

    async createTeam(userId: string, data: { name: string; type?: string; avatar_url?: string }) {
        if (!data.name?.trim()) throw new Error("Team name is required");
        return this.repo.create(data.name.trim(), data.type || 'DOUBLES', userId, data.avatar_url);
    }

    async addMember(teamId: string, requesterId: string, targetUserId: string, role: string = 'MEMBER') {
        const isOwner = await this.repo.isOwner(teamId, requesterId);
        if (!isOwner) throw new Error("UNAUTHORIZED: Only team owners can manage the roster");
        return this.repo.addOrInviteMember(teamId, targetUserId, role);
    }

    async getTeam(teamId: string) {
        const team = await this.repo.findById(teamId);
        if (!team) throw new Error("Team not found");
        return team;
    }
}
