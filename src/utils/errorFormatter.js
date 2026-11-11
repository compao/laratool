import { t } from '../i18n/index.js';

/**
 * Extract raw message text from Error, string, or IPC payload.
 */
function extractRawMessage(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    if (err.reason) return extractRawMessage(err.reason);
    if (err.error) return extractRawMessage(err.error);
    if (typeof err.message === 'string') return err.message;
  }
  return String(err);
}

/**
 * Strip Electron IPC and generic JS Error prefixes.
 */
export function cleanErrorMessage(raw) {
  let msg = extractRawMessage(raw).trim();
  if (!msg) return '';

  // Remove "Error invoking remote method 'channel:name': Error: ..."
  msg = msg.replace(/Error invoking remote method '[^']+':\s*(?:Error:\s*)?/gi, '');
  // Remove leading "Error: " or "Uncaught Error: "
  msg = msg.replace(/^(?:Uncaught\s+)?(?:TypeError|ReferenceError|RangeError|SyntaxError|Error):\s*/i, '');
  // Collapse multiline stack traces if accidentally included
  const firstStackIdx = msg.search(/\r?\n\s+at\s+/);
  if (firstStackIdx > 0) {
    msg = msg.slice(0, firstStackIdx).trim();
  }

  return msg.trim();
}

const ERROR_PATTERNS = [
  {
    regex: /\b(ENOTFOUND|EAI_AGAIN|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|getaddrinfo)\b/i,
    key: 'errors.network_unavailable'
  },
  {
    regex: /\b(ETIMEDOUT|ESOCKETTIMEDOUT|ERR_TIMED_OUT)\b|Délai de connexion dépassé|timed?\s*out/i,
    key: 'errors.timeout'
  },
  {
    regex: /\bECONNREFUSED\b|ERR_CONNECTION_REFUSED/i,
    key: 'errors.connection_refused'
  },
  {
    regex: /\b(ECONNRESET|EPIPE|ERR_CONNECTION_RESET)\b|socket hang up/i,
    key: 'errors.connection_reset'
  },
  {
    regex: /\bEBUSY\b|resource busy or locked/i,
    key: 'errors.file_busy'
  },
  {
    regex: /\b(EACCES|EPERM)\b|operation not permitted|Access is denied|Accès refusé/i,
    key: 'errors.permission_denied'
  },
  {
    regex: /\bENOSPC\b|no space left on device/i,
    key: 'errors.disk_full'
  },
  {
    regex: /\bEADDRINUSE\b|address already in use|port.*already in use/i,
    key: 'errors.port_in_use'
  },
  {
    regex: /\bENOENT\b|no such file or directory|cannot find the path/i,
    key: 'errors.file_not_found'
  },
  {
    regex: /End of central directory|Invalid or unsupported zip|INVALID_ZIP|AdmZip/i,
    key: 'errors.archive_corrupt'
  },
  {
    regex: /\b(404|Not Found)\b.*(?:http|téléchargement|download)|(?:http|Erreur HTTP)\s*404\b/i,
    key: 'errors.http_not_found'
  },
  {
    regex: /\b429\b|Too Many Requests/i,
    key: 'errors.http_rate_limit'
  },
  {
    regex: /(?:http|Erreur HTTP|\()\s*50[0-4]\b/i,
    key: 'errors.http_server_error'
  }
];

/**
 * Format any error into a clear, user-friendly { title, message, detail } object.
 */
export function formatAppError(err, fallbackTitle = '') {
  const cleaned = cleanErrorMessage(err);
  const title = (typeof err === 'object' && err?.title) ? err.title : (fallbackTitle || t('errors.default_title'));

  if (!cleaned) {
    return {
      title,
      message: t('errors.unknown_detail'),
      detail: null
    };
  }

  for (const entry of ERROR_PATTERNS) {
    if (entry.regex.test(cleaned)) {
      const friendly = t(entry.key);
      // Preserve human-written prefix before ":" if it adds useful context (e.g. "Impossible d'installer PHP 8.4 : ...")
      const colonIdx = cleaned.indexOf(' : ');
      const altColonIdx = colonIdx === -1 ? cleaned.indexOf(': ') : colonIdx;
      let prefix = '';
      if (altColonIdx > 0 && altColonIdx < 65) {
        const candidate = cleaned.slice(0, altColonIdx).trim();
        // Only keep prefix if it looks like a readable phrase rather than a JS/Node error code
        if (candidate && !/^(Error|TypeError|E[A-Z]+|spawn|unlink|rmdir|rename|open|read|write)/i.test(candidate)) {
          prefix = candidate;
        }
      }

      const finalMessage = prefix ? `${prefix} — ${friendly}` : friendly;
      return {
        title,
        message: finalMessage,
        detail: cleaned !== finalMessage ? cleaned : null
      };
    }
  }

  // Readable message already (just cleaned of Electron/JS wrappers)
  const maxLen = 220;
  const displayMsg = cleaned.length > maxLen ? cleaned.slice(0, maxLen).trimEnd() + '…' : cleaned;
  return {
    title,
    message: displayMsg,
    detail: cleaned.length > maxLen ? cleaned : null
  };
}
