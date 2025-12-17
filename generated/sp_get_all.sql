DELIMITER $$
CREATE PROCEDURE sp_get_all(IN page INT, IN limit INT)
BEGIN
    DECLARE total_count INT;
    DECLARE total_pages INT;

    -- Validate parameters
    IF page < 1 THEN
        SET page = 1;
    END IF;
    IF limit < 1 THEN
        SET limit = 10;
    END IF;

    -- Get total count of records
    SELECT COUNT(*) INTO total_count FROM orders;
    SET total_pages = CEIL(total_count / limit);

    -- Fetch paginated results
    SELECT * FROM orders
    LIMIT limit OFFSET (page - 1) * limit;

    -- Return pagination info
    SELECT total_count AS total, total_pages AS totalPages, page AS currentPage, limit AS pageSize;
END$$
DELIMITER ;