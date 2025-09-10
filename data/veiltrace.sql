
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
  embedding VECTOR(384) NOT NULL, 
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
) ENGINE=InnoDB;; 

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
) ENGINE=InnoDB;; 
