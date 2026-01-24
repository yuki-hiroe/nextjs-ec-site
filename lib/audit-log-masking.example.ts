/**
 * 監査ログの機密情報マスキング実装例
 * 
 * このファイルは実装例です。実際に使用する場合は、
 * lib/audit-log.ts に統合してください。
 */

/**
 * 機密情報をマスキングする関数
 */
function maskSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // 配列の場合
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  // オブジェクトの場合
  if (typeof data === 'object') {
    const masked: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      // パスワード関連のフィールドを完全にマスキング
      if (lowerKey.includes('password') || lowerKey.includes('passwd')) {
        masked[key] = '********';
        continue;
      }
      
      // クレジットカード番号（16桁の数字）をマスキング
      if (lowerKey.includes('card') && lowerKey.includes('number')) {
        if (typeof value === 'string' && /^\d{13,19}$/.test(value.replace(/\D/g, ''))) {
          const digits = value.replace(/\D/g, '');
          masked[key] = `****-****-****-${digits.slice(-4)}`;
          continue;
        }
      }
      
      // CVV/セキュリティコードをマスキング
      if (lowerKey.includes('cvv') || lowerKey.includes('cvc') || lowerKey.includes('securitycode')) {
        masked[key] = '***';
        continue;
      }
      
      // 電話番号をマスキング（最後の4桁のみ表示）
      if (lowerKey.includes('phone') || lowerKey.includes('tel')) {
        if (typeof value === 'string') {
          const digits = value.replace(/\D/g, '');
          if (digits.length >= 4) {
            masked[key] = `***-****-${digits.slice(-4)}`;
            continue;
          }
        }
      }
      
      // 個人識別番号（マイナンバーなど）をマスキング
      if (lowerKey.includes('ssn') || lowerKey.includes('mynumber') || lowerKey.includes('personalid')) {
        if (typeof value === 'string') {
          masked[key] = '***-****-****';
          continue;
        }
      }
      
      // 再帰的に処理
      masked[key] = maskSensitiveData(value);
    }
    
    return masked;
  }

  // 文字列の場合、クレジットカード番号のパターンをチェック
  if (typeof data === 'string') {
    // 16桁のクレジットカード番号パターン（ハイフンあり/なし）
    const cardPattern = /(\d{4}[- ]?){3}\d{4}/;
    if (cardPattern.test(data)) {
      const digits = data.replace(/\D/g, '');
      if (digits.length >= 13 && digits.length <= 19) {
        return `****-****-****-${digits.slice(-4)}`;
      }
    }
    
    // パスワードハッシュのパターン（bcryptなど）
    if (data.startsWith('$2a$') || data.startsWith('$2b$') || data.startsWith('$2y$')) {
      return '********';
    }
  }

  return data;
}

/**
 * 監査ログの details フィールドをマスキング
 * 
 * 使用例:
 * const maskedDetails = maskAuditLogDetails({
 *   before: { password: "hashed_password", phone: "090-1234-5678" },
 *   after: { password: "new_hashed_password", phone: "090-1234-5678" }
 * });
 */
export function maskAuditLogDetails(details: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!details) {
    return details;
  }
  
  return maskSensitiveData(details) as Record<string, any>;
}

/**
 * 使用例: createAuditLog 関数内で使用
 * 
 * export async function createAuditLog(params: CreateAuditLogParams) {
 *   try {
 *     // details をマスキング
 *     const maskedDetails = params.details 
 *       ? maskAuditLogDetails(params.details)
 *       : undefined;
 *     
 *     const auditLog = await prisma.auditLog.create({
 *       data: {
 *         // ...
 *         details: maskedDetails,
 *         // ...
 *       },
 *     });
 *     
 *     return auditLog;
 *   } catch (error) {
 *     // ...
 *   }
 * }
 */
