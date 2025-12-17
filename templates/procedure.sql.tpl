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

    -- Calculate offset for pagination
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

