<?php

namespace Likipe\HMACBundle\RequestInfoProvider;

use Likipe\HMACBundle\RequestInfoProviderInterface;

use Symfony\Component\HTTPFoundation\Request;

class DefaultRequestInfoProvider implements RequestInfoProviderInterface
{
	public function getAuthorizationHeader(Request $req)
	{
		if($req->headers->has('authorization')) {
			return $req->headers->get('authorization');
		}
		
		/* Apache gobbles up the authorization header, so we need to 
		 * manually retrieve it.
		 */
		if(function_exists('apache_request_headers')) {
			$headers = apache_request_headers();
			
			return empty($headers['Authorization']) ? false : $headers['Authorization'];
		}
		
		return false;
	}
	public function getBody(Request $req)
	{
		return $req->getContent();
	}
	public function getMethod(Request $req)
	{
		return $req->getMethod();
	}
	public function getURI(Request $req)
	{
		return $req->getRequestUri();
	}
	public function getHost(Request $req)
	{
		return strtolower($req->getHost());
	}
	public function getPort(Request $req)
	{
		return $req->getPort();
	}
}
