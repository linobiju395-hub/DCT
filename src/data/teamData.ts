export interface TeamOwner {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  assignedDomainsCount: number;
}

export const TEAM_OWNERS: TeamOwner[] = [
  {
    id: 'team-1',
    name: 'Alex Vance',
    email: 'alex.vance@company.com',
    role: 'Enterprise Admin',
    department: 'DevOps & SRE',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    assignedDomainsCount: 4,
  },
  {
    id: 'team-2',
    name: 'Prashant Kumar',
    email: 'prashant.k@company.com',
    role: 'Staff SecOps Lead',
    department: 'SecOps & IAM',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    assignedDomainsCount: 3,
  },
  {
    id: 'team-3',
    name: 'Sophia Chen',
    email: 'sophia.c@company.com',
    role: 'Principal Architect',
    department: 'Infrastructure',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    assignedDomainsCount: 3,
  },
  {
    id: 'team-4',
    name: 'Jordan Taylor',
    email: 'jordan.t@company.com',
    role: 'FinTech Lead',
    department: 'Payments Core',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    assignedDomainsCount: 2,
  },
  {
    id: 'team-5',
    name: 'Ravi Kumar',
    email: 'ravi.k@company.com',
    role: 'Growth Architect',
    department: 'Growth & Brand',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    assignedDomainsCount: 2,
  },
];
