<?php

namespace Likipe\HMACBundle\Security\Firewall;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Component\HttpKernel\Event\GetResponseEvent;

use Symfony\Component\Security\Http\Firewall\ListenerInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\SecurityContextInterface;
use Symfony\Component\Security\Core\Authentication\AuthenticationManagerInterface;

use Likipe\HMACBundle\Security\Authentication\Token\HMACToken;
use Likipe\HMACBundle\RequestInfoProviderInterface;
use Likipe\HMACBundle\NonceValidatorInterface;

class HMACListener implements ListenerInterface
{
	protected static $required_keys = array('id', 'nonce', 'mac');
	
	protected $securityContext;
	protected $authenticationManager;
	protected $requestInfoProvider;
	protected $nonceValidator;
	
	public function __construct(SecurityContextInterface $securityContext, AuthenticationManagerInterface $authenticationManager, RequestInfoProviderInterface $requestInfoProvider, NonceValidatorInterface $nonceValidator)
	{
		$this->securityContext       = $securityContext;
		$this->authenticationManager = $authenticationManager;
		$this->requestInfoProvider   = $requestInfoProvider;
		$this->nonceValidator        = $nonceValidator;
	}
	
	public function handle(GetResponseEvent $event)
	{
		$request = $event->getRequest();
		
		if( ! ($header = $this->requestInfoProvider->getAuthorizationHeader($request))) {
			$response = new Response();
			$response->setStatusCode(401);
			$response->headers->set('WWW-Authenticate', 'MAC');
			
			$event->setResponse($response);
			
			return;
		}
		
		$matches = array();
		$count   = 0;
		$WS      = '[ \r\n\s]';
		
		/* Check for leading authorization-scheme name */
		$header = preg_replace('/^'.$WS.'*MAC'.$WS.'+/', '', $header, 1, $count);
		
		if($count !== 1) {
			/* Not a HMAC attempt */
			return;
		}
		
		$authParams = array();
		$matches    = array();
		$pattern    = '/^'.$WS.'*(\w+)'.$WS.'*='.$WS.'*"([^"]+)"(?:,)?([\w\W]*)$/';
		
		while(preg_match($pattern, $header, $matches)) {
			if(array_key_exists($matches[1], $authParams)) {
				$response = new Response();
				$response->setStatusCode(401);
				$response->headers->set('WWW-Authenticate', 'MAC error="Duplicate keys."');
				
				$event->setResponse($response);
				
				return;
			}
			
			$authParams[$matches[1]] = $matches[2];
			
			$header  = $matches[3];
			$matches = array();
		}
		
		$header = trim($header, "\r\n\t ");
		
		if( ! empty($header)) {
			
			$response = new Response();
			$response->setStatusCode(401);
			$response->headers->set('WWW-Authenticate', 'MAC error="Malformed Authorization header."');
			
			$event->setResponse($response);
			
			return;
		}
		
		if($diff = array_diff(self::$required_keys, array_keys($authParams))) {
			$response = new Response();
			$response->setStatusCode(401);
			$response->headers->set('WWW-Authenticate', 'MAC error="Missing required keys: '.implode(', ', $diff).'."');
			
			$event->setResponse($response);
			
			return;
		}
		
		/* TODO: Add format validator for the id? */
		
		if( ! $this->nonceValidator->isValid($authParams['id'], $authParams['nonce'])) {
			$response = new Response();
			$response->setStatusCode(401);
			$response->headers->set('WWW-Authenticate', 'MAC error="MAC key identifier and/or nonce is invalid."');
			
			$event->setResponse($response);
			
			return;
		}
		
		$bodyHash = '';
		
		if(array_key_exists('bodyhash', $authParams)) {
			$body = $this->requestInfoProvider->getBody($request);
			
			$bodyHash = empty($body) ? '' : $this->hash($body);
			
			if($bodyHash !== $authParams['bodyhash']) {
				$response = new Response();
				$response->setStatusCode(401);
				$response->headers->set('WWW-Authenticate', 'MAC error="bodyhash parameters do not match."');
				
				$event->setResponse($response);
				
				return;
			}
		}
		
		$normalizedRequest = array(
			$authParams['nonce'],
			$this->requestInfoProvider->getMethod($request),
			/* NOTE: Request::getRequestUri() is not reliable, "fixes" the uri so it is "correct" */
			$this->requestInfoProvider->getURI($request),
			$this->requestInfoProvider->getHost($request),
			$this->requestInfoProvider->getPort($request),
			$bodyHash,
			empty($authParams['ext']) ? '' : $authParams['ext']
		);
		
		$normalizedRequestStr = implode("\n", $normalizedRequest);
		
		$token = new HMACToken();
		
		$token->id     = $authParams['id'];
		$token->reqStr = $normalizedRequestStr;
		$token->mac    = $authParams['mac'];
		
		try {
			$authTok = $this->authenticationManager->authenticate($token);
			
			$this->securityContext->setToken($authTok);
		}
		catch(AuthenticationException $failed) {
			/* TODO: Add debug flag so the $normalizedRequestStr can be compared between client and server? */
			$response = new Response();
			$response->setStatusCode(401);
			$response->headers->set('WWW-Authenticate', 'MAC error="Invalid HMAC."');
			
			$event->setResponse($response);
				
			return;
		}
	}
	
	public function hash($bytes)
	{
		return base64_encode(hash('sha256', $bytes, true));
	}
}



