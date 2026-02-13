export type Profile = {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  reputation_points: number;
  created_at: string;
};

export type Post = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  image_url?: string;
  location?: string;
  status: 'available' | 'reserved' | 'completed';
  created_at: string;
};

export type Request = {
  id: string;
  post_id: string;
  requester_id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'declined';
  message?: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
