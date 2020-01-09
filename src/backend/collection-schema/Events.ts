export interface EventSchema {
  last_updated?: string;
  is_open?: boolean;
  label?: string;
  severity?: number;
  id?: string;
  description?: string;
  type?: string;
  state?: string;
  priority?: number;
  action_ids?: string;
  rule_id?: string;
  assets?: string;
  areas?: string;
}

export interface EventType {
  self_closing?: boolean;
  has_lifecycle?: boolean;
  label?: string;
  severity?: number;
  id?: string;
  description?: string;
  open_states?: string;
  closed_states?: string;
  priority?: number;
  action_types?: string;
}