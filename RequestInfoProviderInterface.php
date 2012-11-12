<?php

namespace Likipe\HMACBundle;

use Symfony\Component\HTTPFoundation\Request;

interface RequestInfoProviderInterface
{
	/**
	 * Returns the "Authorization" header value, false if no such header exists.
	 * 
	 * @return string|false
	 */
	public function getAuthorizationHeader(Request $req);
	/**
	 * Returns the HTTP request body.
	 * 
	 * @return string
	 */
	public function getBody(Request $req);
	/**
	 * Returns the HTTP request method, uppercase.
	 * 
	 * @return string
	 */
	public function getMethod(Request $req);
	/**
	 * Returns the URI in the HTTP request request-line.
	 * 
	 * NOTE: This includes the query string
	 * 
	 * @return string
	 */
	public function getURI(Request $req);
	/**
	 * Returns the request's Host header value, excluding port, lowercase.
	 * 
	 * @return string
	 */
	public function getHost(Request $req);
	/**
	 * Returns the port used by the request.
	 * 
	 * @return string
	 */
	public function getPort(Request $req);
}