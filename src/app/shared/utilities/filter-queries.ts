export function userFilterQuery(value: string): string {
  return `(first_name like "%${value}%") or (last_name like "%${value}%") or (name like "%${value}%") or (email like "%${value}%")`;
}
