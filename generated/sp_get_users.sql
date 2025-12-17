DELIMITER $$

CREATE PROCEDURE sp_get_users(
    IN p_page INT,
    IN p_limit INT,
    OUT p_total INT
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET v_offset = (p_page - 1) * p_limit;

    -- Get total count
    SELECT COUNT(*) INTO p_total FROM users;

    -- Get paginated results
    SELECT 
        id,
        password,
        email,
        phone
    FROM users
    LIMIT p_limit OFFSET v_offset;
END$$

DELIMITER ;