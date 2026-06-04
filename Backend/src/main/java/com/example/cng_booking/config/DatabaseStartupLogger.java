package com.example.cng_booking.config;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseStartupLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseStartupLogger.class);

    private final DataSource dataSource;

    public DatabaseStartupLogger(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (var conn = dataSource.getConnection()) {
            log.info("Database connection OK — URL: {}", conn.getMetaData().getURL());
        } catch (Exception ex) {
            log.error(
                    "Database connection FAILED. Start MySQL, ensure database cng_booking exists, "
                            + "and verify spring.datasource.username/password in application.properties (default: root/root). "
                            + "Error: {}",
                    ex.getMessage());
        }
    }
}
