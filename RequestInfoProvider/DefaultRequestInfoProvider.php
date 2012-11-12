<?php

namespace Likipe\HMACBundle\RequestInfoProvider;

use Likipe\HMACBundle\RequestInfoProviderInterface;

use Symfony\Component\HTTPFoundation\Request;

class DefaultRequestInfoProvider implements RequestInfoProviderInterface
{
	public function getAuthorizationHeader(Request $req)
	{
		return $req->headers->has('authorization') ? $req->headers->get('authorization') : false;
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
