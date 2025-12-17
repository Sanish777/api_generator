DELIMITER $$

CREATE PROCEDURE {{procedure_name}}(
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

    -- Validate parameters
    IF p_page < 1 THEN
        SET p_page = 1;
    END IF;
    IF p_limit < 1 THEN
        SET p_limit = 10;
    END IF;

    -- Calculate offset for pagination (must be calculated in variable, not in LIMIT clause)
    SET v_offset = (p_page - 1) * p_limit;

    -- Get total count of records
    SELECT COUNT(*) INTO p_total FROM {{table_name}};

    -- Fetch paginated data from database
    SELECT 
        {{columns}}
    FROM {{table_name}}
    {{where_clause}}
    ORDER BY {{order_by}} DESC
    LIMIT p_limit OFFSET v_offset;
END$$

DELIMITER ;

