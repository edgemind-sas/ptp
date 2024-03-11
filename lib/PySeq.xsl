<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">
	<xsl:template match="/">
		<html>
			<head>
				<META http-equiv="Content-Type" content="text/html; charset=UTF-16"/>
			</head>
			<body>
				<xsl:for-each select="PYCRS">
					<xsl:variable name="NS" select="@NS"/>
					<xsl:variable name="NSF" select="@NSF"/>
					<p>Number of simulated sequences :
						<xsl:value-of select="@NS"/>
					</p>
					<p>Number of filtred sequences :
						<xsl:value-of select="@NSF"/>
					</p>
					<table border="1" width="100%">
						<thead>
							<tr align="center" valign="middle">
								<td align="center" valign="middle">Sequence probability</td>
								<td align="center" valign="middle" width="15%">Sequence ending reason</td>
								<td width="90%">Description of sequence branches</td>
							</tr>
						</thead>
						<tbody>
							<xsl:for-each select="SEQ">
								<tr>
									<td align="center" valign="middle">
										<xsl:value-of select="@N div $NS" />
									</td>
									<td align="center" valign="middle">
										<xsl:if test="@C">
											<xsl:value-of select="@C" />
										</xsl:if>
										<xsl:if test="not(@C)">
											Normal
										</xsl:if>
									</td>
									<td>
										<table border="1" width="100%">
											<tbody>
												<xsl:for-each select="BR">
													<xsl:if test="position() =1">
														<tr align="center" valign="middle">
															<td align="center" rowspan="2" valign="middle">n°</td>
															<td rowspan="2">Mean time of firing</td>
															<td colspan="4">Transition description</td>
														</tr>
														<tr align="center" valign="middle">
															<td>name</td>
															<td>final state</td>
															<td>type</td>
															<td>law</td>
														</tr>
													</xsl:if>
													<tr>
														<td align="center" valign="middle">
															<xsl:value-of select="position()"/>
														</td>
														<td valign="center">
															<xsl:value-of select="@T" />
														</td>
														<td valign="middle">
															<xsl:for-each select="TR">
																<xsl:value-of select="@NAME" />
																<br />
															</xsl:for-each>
														</td>
														<td valign="middle">
															<xsl:for-each select="TR">
																<xsl:value-of select="@ST" />
																<br />
															</xsl:for-each>
														</td>
														<td valign="middle">
															<xsl:for-each select="TR">
																<xsl:choose>
																	<xsl:when test="@TT = '1'">transition</xsl:when>
																	<xsl:when test="@TT = '2'">fault</xsl:when>
																	<xsl:when test="@TT = '3'">repair</xsl:when>
																	<xsl:otherwise><xsl:value-of select="@TT" /></xsl:otherwise>
																</xsl:choose>
																<br />
															</xsl:for-each>
														</td>
														<td valign="middle">
															<xsl:for-each select="TR">
																<xsl:value-of select="@TD" />
																<br />
															</xsl:for-each>
														</td>
													</tr>
												</xsl:for-each>
											</tbody>
										</table>
									</td>
								</tr>
							</xsl:for-each>
						</tbody>
					</table>
				</xsl:for-each>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>