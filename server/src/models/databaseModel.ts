import { QueryResult } from "pg";
import { pool } from "../config/database.js";
import { logger } from "../utils/logger.js";

/**
 * Formats SQL query for better readability in logs
 * Preserves structure while cleaning up excessive whitespace
 */
const formatSqlQuery = (sql: string): string => {
  return sql
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n    ')
    .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .trim();
};

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  // Log formatted query and params at debug level (log level 0)
  // Note: We don't log the result since it's already visible in the API response
  const formattedQuery = formatSqlQuery(text);
  logger.debug("Database query:", { 
    query: formattedQuery, 
    params: params || [] 
  });
  
  return pool.query(text, params);
};
