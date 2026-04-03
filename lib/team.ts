export const TEAM_MEMBERS = {
    A: 'Christopher',
    B: 'Favour',
    C: 'Evans',
} as const

export type TeamRole = keyof typeof TEAM_MEMBERS

export const TEAM_ROLES: TeamRole[] = ['A', 'B', 'C']

export function getTeamMemberName(role: TeamRole) {
    return TEAM_MEMBERS[role]
}
