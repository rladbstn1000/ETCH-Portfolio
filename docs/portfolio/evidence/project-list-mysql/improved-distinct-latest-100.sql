-- Captured prepared list SELECT, binds: {"1":100}
select pe1_0.id,	(SELECT COUNT(1)
	 FROM project_comment c
	 WHERE c.project_post = pe1_0.id
	 AND c.is_deleted = 0)
,pe1_0.content,pe1_0.created_at,pe1_0.github_url,pe1_0.is_deleted,pe1_0.is_public,(SELECT COUNT(1)
 FROM liked_content lc
 WHERE lc.type = 'PROJECT'
 AND lc.targetId = pe1_0.id)
,pe1_0.member_id,m1_0.id,m1_0.birth,m1_0.email,m1_0.gender,m1_0.isDeleted,m1_0.nickname,m1_0.phoneNumber,m1_0.profile,m1_0.refreshToken,m1_0.role,	(
		(SELECT COUNT(1)
		 FROM liked_content lc
		 WHERE lc.type = 'PROJECT' AND lc.targetId = pe1_0.id) * 4
	  + (SELECT COUNT(1)
	  	 FROM project_comment c
	  	 WHERE c.project_post = pe1_0.id AND c.is_deleted = 0) * 3
	  + COALESCE(pe1_0.view_count, 0) * 2
	)
,pe1_0.category,pe1_0.thumbnail_url,pe1_0.title,pe1_0.updated_at,pe1_0.view_count,pe1_0.youtube_url from project_post pe1_0 join member m1_0 on m1_0.id=pe1_0.member_id where pe1_0.is_deleted=false and pe1_0.is_public=true order by pe1_0.created_at desc limit ?;
