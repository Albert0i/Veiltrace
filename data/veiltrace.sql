
-- veiltrace.imagetrace definition
CREATE or replace TABLE imagetrace 
(
  id int(11) NOT NULL AUTO_INCREMENT,
  imageName varchar(191) NOT NULL,
  fullPath varchar(191) NOT NULL,
  fileFormat varchar(191) NOT NULL,
  fileSize int(11) NOT NULL,
  meta text NOT NULL,
  description text NOT NULL,
  embedding VECTOR(768) NOT NULL, 
  miniature longblob DEFAULT NULL,
  visited int(11) NOT NULL DEFAULT 0,
  updatedAt varchar(191) DEFAULT NULL,
  indexedAt varchar(191) NOT NULL,
  createdAt varchar(191) NOT NULL,
  updateIdent int(11) NOT NULL DEFAULT 0,
  
  PRIMARY KEY (id),
  UNIQUE KEY uniq_image_fullpath (fullPath),
  KEY idx_image_format (fileFormat),
  KEY idx_image_created (createdAt),
  KEY idx_image_visited (visited),
  FULLTEXT KEY fts_image_description (description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE OR REPLACE VECTOR INDEX idx_image_embedding ON imagetrace(embedding) M=16 DISTANCE=cosine; 

-- veiltrace.vistatrace definition
CREATE OR REPLACE TABLE vistatrace 
(
  id int(11) NOT NULL AUTO_INCREMENT,
  imageId int(11) NOT NULL,
  type enum('view','export') NOT NULL DEFAULT 'view',
  createdAt  varchar(191) NOT NULL,
  updateIdent int(11) NOT NULL DEFAULT 0,
  
  PRIMARY KEY (id),
  KEY idx_vista_image_ref (imageId),
  CONSTRAINT VistaTrace_imageId_fkey FOREIGN KEY (imageId) REFERENCES imagetrace (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




-- veiltrace.archivetrace definition (with JSON array)
CREATE OR REPLACE TABLE archivetrace 
(
  id INT(11) NOT NULL AUTO_INCREMENT,
  avatarId int(11) NOT NULL DEFAULT(0), 
  description VARCHAR(191) DEFAULT NULL,
  -- imageIds LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  imageIds JSON CHECK (JSON_VALID(imageIds)),

  updatedAt VARCHAR(191) DEFAULT NULL,
  createdAt VARCHAR(191) NOT NULL,
  updateIdent INT(11) NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  CHECK (JSON_VALID(imageIds))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- INSERT INTO archivetrace (description, imageIds, createdAt) VALUES('Testing 1', '[ 1, 2, 3 ]', '2025-09016')
--
-- JSON Data Type
-- https://mariadb.com/docs/server/reference/data-types/string-data-types/json
-- 