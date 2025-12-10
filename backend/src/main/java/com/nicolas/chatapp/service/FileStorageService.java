package com.nicolas.chatapp.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            // Create base uploads directory
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created uploads directory: {}", uploadPath.toAbsolutePath());
            }
            
            // Create subdirectories
            Path profilesPath = Paths.get(uploadDir, "profiles");
            if (!Files.exists(profilesPath)) {
                Files.createDirectories(profilesPath);
                log.info("Created profiles directory: {}", profilesPath.toAbsolutePath());
            }
            
            Path groupsPath = Paths.get(uploadDir, "groups");
            if (!Files.exists(groupsPath)) {
                Files.createDirectories(groupsPath);
                log.info("Created groups directory: {}", groupsPath.toAbsolutePath());
            }
            
            Path messagesPath = Paths.get(uploadDir, "messages");
            if (!Files.exists(messagesPath)) {
                Files.createDirectories(messagesPath);
                log.info("Created messages directory: {}", messagesPath.toAbsolutePath());
            }
            
            log.info("File storage initialized successfully at: {}", Paths.get(uploadDir).toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to create uploads directory: {}", uploadDir, e);
            throw new RuntimeException("Failed to initialize file storage", e);
        }
    }

    public String storeFile(MultipartFile file, String subDirectory) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }

        // Create directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("File saved: {}", filePath.toString());
        return subDirectory + "/" + filename;
    }

    public void deleteFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            Files.deleteIfExists(path);
            log.info("File deleted: {}", path.toString());
        } catch (IOException e) {
            log.error("Error deleting file: {}", filePath, e);
        }
    }

    public Path loadFile(String filePath) {
        return Paths.get(uploadDir, filePath);
    }
}

