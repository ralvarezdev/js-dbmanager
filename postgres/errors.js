// IsUniqueConstraintError checks if the error is a unique constraint error
export function IsUniqueConstraintError(error){
    // Check if the error is a unique constraint violation
    if (error.code !== '23505') return false

    // Check if the error message contains the unique constraint name
    return error.constraint || 'unknown';
}