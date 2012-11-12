<?php

namespace Likipe\HMACBundle\Security\Authentication\Token;

use Symfony\Component\Security\Core\Authentication\Token\AbstractToken;

class HMACToken extends AbstractToken
{
	public $id;
	public $reqStr;
	public $hmac;
	
	public function __construct(array $roles = array())
	{
		parent::__construct($roles);
		
		$this->setAuthenticated(count($roles) > 0);
	}
	
	public function getCredentials()
	{
		return '';
	}
}