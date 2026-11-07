export type Visibility = 'everyone' | 'contacts' | 'nobody';

export interface Profile {
  id: string;
  mas_id: string;
  username: string;
  display_name: string;
  bio: string;
  status_text: string;
  avatar_url: string | null;
  is_deactivated: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  phone: string | null;
  last_seen: Visibility;
  read_receipts: boolean;
  who_can_message: Visibility;
  story_visibility: Visibility;
  profile_visibility: Visibility;
  notify_messages: boolean;
  notify_calls: boolean;
  notify_communities: boolean;
  notify_stories: boolean;
  notify_social: boolean;
}
